const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db');

// Get all schedules with report details
router.get('/', async (req, res) => {
  try {
    const schedules = await all(`
      SELECT s.*, r.title as report_title, r.location_address,
             u.name as created_by_name
      FROM schedules s
      JOIN reports r ON s.report_id = r.id
      JOIN users u ON s.created_by = u.id
      ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
    `);

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('Get schedules error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules',
      error: error.message,
    });
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await get(`
      SELECT s.*, r.title as report_title, r.location_address,
             r.latitude, r.longitude, r.photo_url,
             u.name as created_by_name
      FROM schedules s
      JOIN reports r ON s.report_id = r.id
      JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Get schedule error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedule',
      error: error.message,
    });
  }
});

// Create new schedule (Petugas only)
router.post('/', async (req, res) => {
  try {
    const { report_id, scheduled_date, scheduled_time, notes, created_by } = req.body;

    if (!report_id || !scheduled_date || !scheduled_time || !created_by) {
      return res.status(400).json({
        success: false,
        message: 'report_id, scheduled_date, scheduled_time, and created_by are required',
      });
    }

    // Check if report exists
    const report = await get('SELECT id FROM reports WHERE id = ?', [report_id]);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check if user exists and is petugas
    const user = await get('SELECT id, role FROM users WHERE id = ?', [created_by]);
    if (!user || user.role !== 'petugas') {
      return res.status(403).json({
        success: false,
        message: 'Only petugas can create schedules',
      });
    }

    const result = await run(
      `INSERT INTO schedules (report_id, scheduled_date, scheduled_time, notes, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [report_id, scheduled_date, scheduled_time, notes || null, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        id: result.insertId,
        report_id,
        scheduled_date,
        scheduled_time,
        notes,
        created_by,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Create schedule error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating schedule',
      error: error.message,
    });
  }
});

// Update schedule status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending or selesai',
      });
    }

    const schedule = await get('SELECT id FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    await run('UPDATE schedules SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      id,
    ]);

    res.status(200).json({
      success: true,
      message: 'Schedule status updated successfully',
      data: {
        id: parseInt(id),
        status,
      },
    });
  } catch (error) {
    console.error('Update schedule error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating schedule',
      error: error.message,
    });
  }
});

// Update schedule details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, scheduled_time, notes } = req.body;

    const schedule = await get('SELECT id FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    await run(
      `UPDATE schedules 
       SET scheduled_date = ?, scheduled_time = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [scheduled_date, scheduled_time, notes || null, id]
    );

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        id: parseInt(id),
        scheduled_date,
        scheduled_time,
        notes,
      },
    });
  } catch (error) {
    console.error('Update schedule error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating schedule',
      error: error.message,
    });
  }
});

// Confirm schedule completed (mark report as selesai)
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed_by } = req.body;

    if (!confirmed_by) {
      return res.status(400).json({
        success: false,
        message: 'confirmed_by is required',
      });
    }

    const schedule = await get('SELECT id, report_id FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Update schedule status to selesai
    await run('UPDATE schedules SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      'selesai',
      id,
    ]);

    // Update report status to selesai
    await run('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      'selesai',
      schedule.report_id,
    ]);

    res.status(200).json({
      success: true,
      message: 'Schedule confirmed and report marked as completed',
      data: {
        schedule_id: parseInt(id),
        report_id: schedule.report_id,
        status: 'selesai',
      },
    });
  } catch (error) {
    console.error('Confirm schedule error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error confirming schedule',
      error: error.message,
    });
  }
});

// Delete schedule (Petugas only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
      });
    }

    // Check if user exists and is petugas
    const user = await get('SELECT id, role FROM users WHERE id = ?', [user_id]);
    if (!user || user.role !== 'petugas') {
      return res.status(403).json({
        success: false,
        message: 'Only petugas can delete schedules',
      });
    }

    // Check if schedule exists
    const schedule = await get('SELECT id FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Delete schedule
    await run('DELETE FROM schedules WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Delete schedule error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting schedule',
      error: error.message,
    });
  }
});

module.exports = router;
