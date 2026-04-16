const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db');

// Get all reports with optional filter
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let reports;
    if (status) {
      reports = all('SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC', [status]);
    } else {
      reports = all('SELECT * FROM reports ORDER BY created_at DESC');
    }

    // Enrich reports with schedule info and auto-update status if needed
    const today = new Date().toISOString().split('T')[0];
    
    reports = reports.map((report) => {
      const schedule = get(`
        SELECT id, scheduled_date, scheduled_time, status as schedule_status, notes
        FROM schedules
        WHERE report_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [report.id]);

      // Auto-update report status berdasarkan schedule
      if (schedule) {
        if (schedule.schedule_status === 'selesai') {
          // Jika schedule sudah selesai, report harus selesai
          if (report.status !== 'selesai') {
            run('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
              'selesai',
              report.id,
            ]);
            report.status = 'selesai';
          }
        } else if (schedule.scheduled_date === today && report.status === 'pending') {
          // Jika jadwal hari ini dan status masih pending, ubah ke diproses
          run('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
            'diproses',
            report.id,
          ]);
          report.status = 'diproses';
        }
      }

      return {
        ...report,
        schedule: schedule || null,
      };
    });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Get reports error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message,
    });
  }
});

// Get report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = get('SELECT * FROM reports WHERE id = ?', [id]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Get related schedule if exists
    const schedule = get(`
      SELECT id, scheduled_date, scheduled_time, status as schedule_status, notes
      FROM schedules
      WHERE report_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);

    // Check if schedule is today and update report status if needed
    if (schedule) {
      const today = new Date().toISOString().split('T')[0];
      const scheduledDate = schedule.scheduled_date;

      if (schedule.schedule_status === 'selesai') {
        // Jika schedule sudah selesai, report harus selesai
        if (report.status !== 'selesai') {
          run('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
            'selesai',
            id,
          ]);
          report.status = 'selesai';
        }
      } else if (scheduledDate === today && report.status === 'pending') {
        // Jika jadwal hari ini dan status masih pending, ubah ke diproses
        run('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
          'diproses',
          id,
        ]);
        report.status = 'diproses';
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...report,
        schedule: schedule || null,
      },
    });
  } catch (error) {
    console.error('Get report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message,
    });
  }
});

// Create new report
router.post('/', async (req, res) => {
  try {
    const { user_id, title, description, location_address, latitude, longitude, photo_url } = req.body;

    // Validation
    if (!user_id || !title || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'user_id, title, latitude, and longitude are required',
      });
    }

    // Check if user exists
    const user = get('SELECT id FROM users WHERE id = ?', [user_id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Insert report
    const result = run(
      'INSERT INTO reports (user_id, title, description, location_address, latitude, longitude, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, title, description || null, location_address || null, latitude, longitude, photo_url || null]
    );

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        id: result.lastInsertRowid,
        user_id,
        title,
        description,
        location_address,
        latitude,
        longitude,
        photo_url,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Create report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message,
    });
  }
});

// Update report status
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

    const validStatuses = ['pending', 'diproses', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, diproses, or selesai',
      });
    }

    // Check if report exists
    const report = get('SELECT id FROM reports WHERE id = ?', [id]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Update status
    run('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      id,
    ]);

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: {
        id: parseInt(id),
        status,
      },
    });
  } catch (error) {
    console.error('Update report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message,
    });
  }
});

// Delete report (Petugas only)
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
    const user = get('SELECT id, role FROM users WHERE id = ?', [user_id]);
    if (!user || user.role !== 'petugas') {
      return res.status(403).json({
        success: false,
        message: 'Only petugas can delete reports',
      });
    }

    // Check if report exists
    const report = get('SELECT id FROM reports WHERE id = ?', [id]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Delete related schedules first
    run('DELETE FROM schedules WHERE report_id = ?', [id]);

    // Delete report
    run('DELETE FROM reports WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message,
    });
  }
});

module.exports = router;
