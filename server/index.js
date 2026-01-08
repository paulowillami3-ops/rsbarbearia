const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = 3001;
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// --- Database Init ---

// 0. Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM admins WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        if (row) {
            res.json({ message: "success", data: { id: row.id, email: row.email } });
        } else {
            res.status(401).json({ error: "Credenciais inválidas" });
        }
    });
});

// 1. Get Services
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services WHERE is_active = 1", [], (err, rows) => {
        if (err) { return res.status(400).json({ error: err.message }); }
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/services', (req, res) => {
    const { name, description, price, duration, imageUrl } = req.body;
    const sql = "INSERT INTO services (name, description, price, duration, image_url, is_active) VALUES (?, ?, ?, ?, ?, 1)";
    db.run(sql, [name, description, price, duration, imageUrl], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success", id: this.lastID });
    });
});

app.put('/api/services/:id', (req, res) => {
    const { name, description, price, duration, imageUrl } = req.body;
    const sql = "UPDATE services SET name = ?, description = ?, price = ?, duration = ?, image_url = ? WHERE id = ?";
    db.run(sql, [name, description, price, duration, imageUrl, req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

app.delete('/api/services/:id', (req, res) => {
    // Soft delete
    db.run("UPDATE services SET is_active = 0 WHERE id = ?", [req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 2. Create Appointment
app.post('/api/appointments', (req, res) => {
    const { customerName, customerPhone, services, date, time, totalPrice } = req.body;

    if (!customerPhone) {
        res.status(400).json({ error: "Phone number is required" });
        return;
    }

    // Find or Create Client
    const getClientSqL = "SELECT id FROM clients WHERE phone = ?";
    db.get(getClientSqL, [customerPhone], (err, row) => {
        if (err) { return res.status(500).json({ error: err.message }); }

        let clientId;
        if (row) {
            clientId = row.id;
            createAppointment(clientId);
        } else {
            const insertClientSql = "INSERT INTO clients (name, phone) VALUES (?, ?)";
            db.run(insertClientSql, [customerName, customerPhone], function (err) {
                if (err) { return res.status(500).json({ error: err.message }); }
                clientId = this.lastID;
                createAppointment(clientId);
            });
        }

        function createAppointment(cId) {
            const insertApptSql = `INSERT INTO appointments (client_id, appointment_date, appointment_time, total_price, status) VALUES (?, ?, ?, ?, 'PENDING')`;
            db.run(insertApptSql, [cId, date, time, totalPrice], function (err) {
                if (err) { return res.status(500).json({ error: err.message }); }
                const appointmentId = this.lastID;

                // Insert Services
                if (services && services.length > 0) {
                    const stmt = db.prepare("INSERT INTO appointment_services (appointment_id, service_id, price_at_booking) VALUES (?, ?, ?)");
                    services.forEach(s => {
                        stmt.run(appointmentId, s.id, s.price);
                    });
                    stmt.finalize();
                }

                res.json({
                    message: "success",
                    data: { id: appointmentId, status: 'PENDING' }
                });
            });
        }
    });
});

// 2.1 Update Appointment (Status)
app.put('/api/appointments/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE appointments SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 3. Get Appointments (For Admin or View)
app.get('/api/appointments', (req, res) => {
    const { phone } = req.query;
    let sql = `
    SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.total_price, c.name as customerName, c.phone as customerPhone 
    FROM appointments a 
    JOIN clients c ON a.client_id = c.id
  `;
    let params = [];

    if (phone) {
        sql += ` WHERE c.phone = ?`;
        params.push(phone);
    }
    // Removed filtering of COMPLETED to show them in the daily list (bottom section)

    // "Os horarios mais cedo ficam na frente" -> Sort by Date/Time ASC
    sql += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;

    db.all(sql, params, (err, appointments) => {
        if (err) { return res.status(400).json({ error: err.message }); }

        // Now fetch services for these appointments
        if (appointments.length === 0) {
            return res.json({ message: "success", data: [] });
        }

        const placeholders = appointments.map(() => '?').join(',');
        const ids = appointments.map(a => a.id);

        const servicesSql = `
      SELECT aps.appointment_id, s.id, s.name, s.price, s.duration 
      FROM appointment_services aps
      JOIN services s ON aps.service_id = s.id
      WHERE aps.appointment_id IN (${placeholders})
    `;

        db.all(servicesSql, ids, (err, servicesRows) => {
            if (err) { return res.status(400).json({ error: err.message }); }

            // Map services to appointments
            const result = appointments.map(app => {
                const appServices = servicesRows
                    .filter(s => s.appointment_id === app.id)
                    .map(s => ({ id: String(s.id), name: s.name, price: s.price, duration: s.duration }));

                return {
                    id: String(app.id),
                    customerName: app.customerName,
                    customerPhone: app.customerPhone,
                    services: appServices,
                    date: app.appointment_date,
                    time: app.appointment_time.slice(0, 5), // HH:mm:ss -> HH:mm
                    totalPrice: app.total_price,
                    status: app.status
                };
            });

            res.json({ message: "success", data: result });
        });
    });
});

// 3.1 Get Clients (Admin)
app.get('/api/clients', (req, res) => {
    db.all("SELECT * FROM clients ORDER BY name ASC", [], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success", data: rows });
    });
});

// 3.2 Lookup Client (Auto-fill)
app.get('/api/clients/lookup', (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone required" });

    db.get("SELECT * FROM clients WHERE phone = ?", [phone], (err, row) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        if (row) {
            res.json({ message: "success", data: row });
        } else {
            res.status(404).json({ message: "not found" });
        }
    });
});

// 3.3 Update Client
app.put('/api/clients/:id', (req, res) => {
    const { name, phone } = req.body;
    db.run("UPDATE clients SET name = ?, phone = ? WHERE id = ?", [name, phone, req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 3.4 Delete Client
app.delete('/api/clients/:id', (req, res) => {
    db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 4. Chat - Send Message
app.post('/api/chat', (req, res) => {
    const { sender, text, phone, name } = req.body;

    if (sender === 'BARBER') {
        // Admin sending to a specific client (passed via body usually, or implied context)
        // For admin, we expect clientId or phone to be passed to know who they are talking to
        // If simply replying to the "current open chat", frontend must send target phone/id
        const targetClientId = req.body.clientId;
        if (targetClientId) {
            insertMessage(targetClientId);
        } else {
            // Fallback or error
            return res.status(400).json({ error: "Target client required for admin message" });
        }
        return;
    }

    // Customer sending
    if (!phone) {
        return res.status(400).json({ error: "Phone required for identification" });
    }

    db.get("SELECT id FROM clients WHERE phone = ?", [phone], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            insertMessage(row.id);
        } else {
            // Create new client
            const clientName = name || `Cliente ${phone}`;
            db.run("INSERT INTO clients (name, phone) VALUES (?, ?)", [clientName, phone], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                insertMessage(this.lastID);
            });
        }
    });

    function insertMessage(cId) {
        const sql = "INSERT INTO chat_messages (client_id, sender_type, message_text) VALUES (?, ?, ?)";
        db.run(sql, [cId, sender, text], function (err) {
            if (err) { return res.status(500).json({ error: err.message }); }
            res.json({
                message: "success",
                data: { id: this.lastID, text, sender, timestamp: new Date() }
            });
        });
    }
});

app.delete('/api/appointments/:id', (req, res) => {
    db.run("DELETE FROM appointments WHERE id = ?", [req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 5. Chat - Get Messages or Conversations
app.get('/api/chat/conversations', (req, res) => {
    // List all clients who have messages, ordered by most recent message
    const sql = `
        SELECT c.id, c.name, c.phone, MAX(m.sent_at) as last_message, COUNT(m.id) as msg_count 
        FROM chat_messages m 
        JOIN clients c ON m.client_id = c.id 
        GROUP BY c.id 
        ORDER BY last_message DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) { return res.status(400).json({ error: err.message }); }
        res.json({ message: "success", data: rows });
    });
});

app.get('/api/chat', (req, res) => {
    const { phone, clientId } = req.query;
    let sql = `SELECT * FROM chat_messages ORDER BY sent_at ASC`;
    let params = [];

    if (clientId) {
        sql = `SELECT * FROM chat_messages WHERE client_id = ? ORDER BY sent_at ASC`;
        params = [clientId];
    } else if (phone) {
        sql = `
       SELECT m.* 
       FROM chat_messages m 
       LEFT JOIN clients c ON m.client_id = c.id 
       WHERE c.phone = ? 
       ORDER BY m.sent_at ASC
     `;
        params = [phone];
    }
    // If no filter, maybe return all? Or empty? For now keep existing behavior/all but careful with privacy. 
    // In prod, secure this.

    db.all(sql, params, (err, rows) => {
        if (err) { return res.status(400).json({ error: err.message }); }
        res.json({
            message: "success",
            data: rows.map(r => ({
                id: r.id,
                text: r.message_text,
                sender: r.sender_type,
                timestamp: r.sent_at
            }))
        });
    });
});

// 6. Blocked Slots
app.get('/api/blocked-slots', (req, res) => {
    db.all("SELECT * FROM blocked_slots", [], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/blocked-slots', (req, res) => {
    const { date, time, reason } = req.body;
    const sql = "INSERT INTO blocked_slots (date, time, reason) VALUES (?, ?, ?)";
    db.run(sql, [date, time, reason], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success", id: this.lastID });
    });
});

app.delete('/api/blocked-slots/:id', (req, res) => {
    db.run("DELETE FROM blocked_slots WHERE id = ?", [req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 7. Settings
app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json({ message: "success", data: settings });
    });
});

app.post('/api/settings', (req, res) => {
    const { start_time, end_time, interval_minutes, lunch_start, lunch_end } = req.body;
    const updates = [
        { key: 'start_time', value: start_time },
        { key: 'end_time', value: end_time },
        { key: 'interval_minutes', value: String(interval_minutes) },
        { key: 'lunch_start', value: lunch_start },
        { key: 'lunch_end', value: lunch_end }
    ];

    // Simple way: run multiple updates. In prod, use transaction.
    let completed = 0;
    updates.forEach(u => {
        db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?", [u.key, u.value, u.value], (err) => {
            completed++;
            if (completed === updates.length) res.json({ message: "success" });
        });
    });
});

// 8. Expenses
app.get('/api/expenses', (req, res) => {
    db.all("SELECT * FROM expenses ORDER BY date DESC", [], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/expenses', (req, res) => {
    const { description, amount, category, date } = req.body;
    const sql = "INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)";
    db.run(sql, [description, amount, category, date], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success", id: this.lastID });
    });
});

app.delete('/api/expenses/:id', (req, res) => {
    db.run("DELETE FROM expenses WHERE id = ?", [req.params.id], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: "success" });
    });
});

// 9. Statistics for Dashboard
app.get('/api/stats', (req, res) => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    // Parallelize queries
    const queries = {
        monthlyRevenue: `SELECT SUM(total_price) as total FROM appointments WHERE strftime('%Y-%m', appointment_date) = ? AND status = 'COMPLETED'`,
        monthlyExpenses: `SELECT SUM(amount) as total FROM expenses WHERE strftime('%Y-%m', date) = ?`,
        serviceDistribution: `
            SELECT s.name, COUNT(aps.service_id) as count 
            FROM appointment_services aps
            JOIN services s ON aps.service_id = s.id
            JOIN appointments a ON aps.appointment_id = a.id
            WHERE a.status = 'COMPLETED'
            GROUP BY s.name
        `,
        revenueHistory: `
            SELECT strftime('%Y-%m', appointment_date) as month, SUM(total_price) as total 
            FROM appointments 
            WHERE status = 'COMPLETED' 
            AND appointment_date >= date('now', '-6 months')
            GROUP BY month
            ORDER BY month ASC
        `
    };

    db.get(queries.monthlyRevenue, [currentMonth], (err, revRow) => {
        if (err) return res.status(500).json({ error: err.message });
        const revenue = revRow?.total || 0;

        db.get(queries.monthlyExpenses, [currentMonth], (err, expRow) => {
            if (err) return res.status(500).json({ error: err.message });
            const expenses = expRow?.total || 0;

            db.all(queries.serviceDistribution, [], (err, servRows) => {
                if (err) return res.status(500).json({ error: err.message });

                db.all(queries.revenueHistory, [], (err, histRows) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json({
                        message: "success",
                        data: {
                            revenue,
                            expenses,
                            profit: revenue - expenses,
                            serviceDistribution: servRows,
                            revenueHistory: histRows
                        }
                    });
                });
            });
        });
    });
});

// SPA Catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
