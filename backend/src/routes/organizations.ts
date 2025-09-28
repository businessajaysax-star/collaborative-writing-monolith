import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/auth';
import { validate } from '../utils/validation';
import { organizationSchemas, paginationSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole } from '../types';

const router = Router();

// Get all organizations
router.get('/', authenticateToken, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const orgsResult = await query(
      `SELECT o.*, u.first_name, u.last_name as creator_name
       FROM organizations o
       LEFT JOIN users u ON o.created_by = u.id
       ORDER BY o.${sort} ${order}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM organizations');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: orgsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get organization by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orgResult = await query(
      `SELECT o.*, u.first_name, u.last_name as creator_name
       FROM organizations o
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orgResult.rows.length === 0) {
      throw new CustomError('Organization not found', 404);
    }

    res.json({ success: true, data: orgResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Create organization
router.post('/', authenticateToken, validate(organizationSchemas.create), async (req, res, next) => {
  try {
    const { name, description, logo_url, website, contact_email } = req.body;
    const created_by = req.user?.user_id;

    const result = await query(
      `INSERT INTO organizations (name, description, logo_url, website, contact_email, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, logo_url, website, contact_email, created_by]
    );

    const organization = result.rows[0];

    // Add creator as admin member
    await query(
      'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
      [organization.id, created_by, UserRole.ADMIN]
    );

    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

// Update organization
router.put('/:id', authenticateToken, validate(organizationSchemas.update), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user is admin of the organization or system admin
    const membershipResult = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, req.user?.user_id]
    );

    if (membershipResult.rows.length === 0 && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await query(
      `UPDATE organizations SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, ...updateValues]
    );

    if (result.rows.length === 0) {
      throw new CustomError('Organization not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete organization
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM organizations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new CustomError('Organization not found', 404);
    }

    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get organization members
router.get('/:id/members', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const membersResult = await query(
      `SELECT om.*, u.first_name, u.last_name, u.email, u.avatar_url, u.role as user_role
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1 AND om.is_active = true
       ORDER BY om.joined_at`,
      [id]
    );

    res.json({ success: true, data: membersResult.rows });
  } catch (error) {
    next(error);
  }
});

// Add member to organization
router.post('/:id/members', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, role = UserRole.STUDENT } = req.body;

    // Check if user is admin of the organization or system admin
    const membershipResult = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, req.user?.user_id]
    );

    if (membershipResult.rows.length === 0 && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const result = await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user_id, role]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update member role
router.put('/:id/members/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    // Check if user is admin of the organization or system admin
    const membershipResult = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, req.user?.user_id]
    );

    if (membershipResult.rows.length === 0 && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const result = await query(
      'UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING *',
      [role, id, userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('Member not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Remove member from organization
router.delete('/:id/members/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    // Check if user is admin of the organization or system admin
    const membershipResult = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, req.user?.user_id]
    );

    if (membershipResult.rows.length === 0 && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const result = await query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('Member not found', 404);
    }

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;


