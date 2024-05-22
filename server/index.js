const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql');
const moment = require('moment'); 

app.use(cors());
app.use(express.json()); // Pour parser le JSON dans le corps des requêtes

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestionsejour'
});

// Route pour récupérer un séjour par ID
app.get('/sejour/:id', (req, res) => {
    const sejourId = req.params.id;

    const query = 'select date_debut, date_fin, commentaire, est_arrive, est_parti, nom, libelle as lit from sejour join user on sejour.le_patient_id = user.id join lit on sejour.le_lit_id = lit.id where sejour.id = ?';
    db.query(query, [sejourId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la récupération du séjour');
        } else if (results.length === 0) {
            res.status(404).send('Séjour non trouvé');
        } else {
            res.json(results[0]);
        }
    });
});

// Route pour mettre à jour un séjour par ID
app.put('/sejour/:id', (req, res) => {
    const sejourId = req.params.id;
    const { commentaire, est_arrive, est_parti } = req.body;

    // Vérifie si les données sont valides
    if (typeof commentaire !== 'string' || ![0, 1].includes(est_arrive) || ![0, 1].includes(est_parti)) {
        console.error('Invalid data received:', req.body);
        return res.status(400).send('Invalid data');
    }

    const query = 'UPDATE sejour SET commentaire = ?, est_arrive = ?, est_parti = ? WHERE id = ?';
    db.query(query, [commentaire, est_arrive, est_parti, sejourId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la mise à jour du séjour');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Séjour non trouvé');
        } else {
            res.send('Séjour mis à jour avec succès');
        }
    });
});

// Route pour récupérer les séjours dont la date de fin est aujourd'hui
app.get('/sorties', (req, res) => {
    const today = moment().format('YYYY-MM-DD');

    const query = 'SELECT sejour.*, user.nom FROM sejour INNER JOIN user ON sejour.le_patient_id = user.id WHERE date_fin = ? AND est_parti = 0';
    db.query(query, [today], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la récupération des séjours');
        } else {
            res.json(results);
        }
    });
});

// Route pour mettre à jour le statut de sortie d'un séjour
app.put('/sorties/:id', (req, res) => {
    const sejourId = req.params.id;
    const query = 'UPDATE sejour SET est_parti = 1 WHERE id = ?';

    db.query(query, [sejourId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la mise à jour du séjour');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Séjour non trouvé');
        } else {
            res.send('Sortie validée avec succès');
        }
    });
});

// Route pour récupérer les séjours dont la date d'arrivée est aujourd'hui
app.get('/arrivees', (req, res) => {
    const today = moment().format('YYYY-MM-DD');

    const query = 'SELECT sejour.*, user.nom FROM sejour INNER JOIN user ON sejour.le_patient_id = user.id WHERE date_debut = ? AND est_arrive = 0';
    db.query(query, [today], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la récupération des séjours');
        } else {
            res.json(results);
        }
    });
});

// Route pour mettre à jour le statut d'arrivée d'un séjour
app.put('/arrivees/:id', (req, res) => {
    const sejourId = req.params.id;
    const query = 'UPDATE sejour SET est_arrive = 1 WHERE id = ?';

    db.query(query, [sejourId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la mise à jour du séjour');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Séjour non trouvé');
        } else {
            res.send('Arrivée validée avec succès');
        }
    });
});

// Route pour récupérer les séjours selon les critères de recherche
app.get('/consultation', (req, res) => {
    const date_debut = req.query.date_debut;
    const date_fin = req.query.date_fin;
    const nom = req.query.nom;
    const est_arrive = req.query.est_arrive;
    const est_parti = req.query.est_parti;
    const commentaire = req.query.commentaire;
    
    let query = 'SELECT sejour.*, user.nom FROM sejour INNER JOIN user ON sejour.le_patient_id = user.id WHERE 1=1';
    let queryParams = [];
    
    if (date_debut) {
        query += ' AND date_debut = ?';
        queryParams.push(date_debut);
    }
    if (date_fin) {
        query += ' AND date_fin = ?';
        queryParams.push(date_fin);
    }
    if (nom) {
        query += ' AND nom = ?';
        queryParams.push(nom);
    }
    if (est_arrive !== '') {
        query += ' AND est_arrive = ?';
        queryParams.push(est_arrive);
    }
    if (est_parti !== '') {
        query += ' AND est_parti = ?';
        queryParams.push(est_parti);
    }
    if (commentaire) {
        query += ' AND commentaire LIKE ?';
        queryParams.push(`%${commentaire}%`);
    }
        
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de la récupération des séjours');
        } else {
            res.json(results);
        }
    });
});

app.listen(8080, () => {
    console.log('server listening on 8080');
});
