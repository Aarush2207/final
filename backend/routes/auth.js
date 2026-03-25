const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// ── Manager Login ────────────────────────────────────────────
router.post('/manager/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const { data, error } = await supabase
      .from('managers')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single();

    if (error) {
      console.error('Manager login error:', error);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (!data)
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ success: true, user: { ...data, role: 'manager' } });
  } catch (err) {
    console.error('Manager login exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Employee Login ───────────────────────────────────────────
router.post('/employee/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        roles(id, name, description),
        employee_skills(*)
      `)
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single();

    if (error) {
      console.error('Employee login error:', error);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (!data)
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ success: true, user: { ...data, role: 'employee' } });
  } catch (err) {
    console.error('Employee login exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Employee Register (by manager invite or self) ────────────
router.post('/employee/register', async (req, res) => {
  try {
    const { name, email, password, phone, experience_years, manager_id } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    // Check duplicate
    const { data: existing, error: checkError } = await supabase
      .from('employees')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is expected)
      console.error('Error checking existing employee:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' });

    const { data, error } = await supabase
      .from('employees')
      .insert([{
        name,
        email: email.trim().toLowerCase(),
        password,
        phone: phone || null,
        experience_years: experience_years || 0,
        manager_id: manager_id || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Employee registration error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, user: { ...data, role: 'employee' } });
  } catch (err) {
    console.error('Employee registration exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
