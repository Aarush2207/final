const express = require('express');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { rankEmployeesForRole } = require('../services/rankService');
const { suggestCourses } = require('../services/courseService');

const router = express.Router();

// GET /employees
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /employees
router.post('/', authMiddleware, async (req, res) => {
  const { name, role, experience, skills, ratings, communication_score, strengths, weaknesses, status, interview_completed } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        name, role: role || '', experience: experience || 0,
        skills: skills || [], ratings: ratings || {},
        communication_score: communication_score || 0,
        strengths: strengths || [], weaknesses: weaknesses || [],
        status: status || 'Active',
        interview_completed: interview_completed === true,
        manager_id: req.managerId,
      }])
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /employees/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('employees').update(req.body).eq('id', id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /employees/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Employee deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /employees/:id (single)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('employees').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Employee not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /employees/rank/:roleId
router.get('/rank/:roleId', authMiddleware, async (req, res) => {
  const { roleId } = req.params;
  const topN = parseInt(req.query.top) || 5;
  try {
    const result = await rankEmployeesForRole(roleId, topN);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /employees/:id/courses - course suggestions for weak skills
router.get('/:id/courses', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: employee, error } = await supabase
      .from('employees').select('*').eq('id', id).single();
    if (error || !employee) return res.status(404).json({ error: 'Employee not found' });
    const ratings = employee.ratings || {};
    const skills = employee.skills || [];
    const suggestions = {};
    for (const skill of skills) {
      const ratingKey = Object.keys(ratings).find(k => k.toLowerCase() === skill.toLowerCase());
      const rating = ratingKey ? Number(ratings[ratingKey]) : 0;
      if (rating < 3 || rating === 0) {
        suggestions[skill] = suggestCourses(skill);
      }
    }
    return res.json({ employee: { id: employee.id, name: employee.name }, suggestions });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /employees/:id/notifications
router.get('/:id/notifications', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('notifications').select('*').eq('employee_id', id)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /employees/:id/notifications
router.post('/:id/notifications', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { type, message, metadata } = req.body;
  if (!type || !message) return res.status(400).json({ error: 'type and message required' });
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ employee_id: id, manager_id: req.managerId, type, message, metadata: metadata || {}, read: false }])
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /employees/:id/notifications/:notifId/read
router.patch('/:id/notifications/:notifId/read', authMiddleware, async (req, res) => {
  const { notifId } = req.params;
  try {
    const { data, error } = await supabase
      .from('notifications').update({ read: true }).eq('id', notifId).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
