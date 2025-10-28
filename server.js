const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload size limits for large files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log all requests with details
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers.accept);
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const modelsDir = path.join(__dirname, 'public', 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    cb(null, modelsDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'tooth.glb');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.glb')) {
      cb(null, true);
    } else {
      cb(new Error('Only GLB files are allowed'));
    }
  }
});

// Serve static files from public directory (includes public/models)
app.use(express.static('public'));

// Serve data directory
app.use('/data', express.static('data'));

// File upload endpoint
app.post('/upload', upload.single('glbFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('GLB file uploaded successfully:', req.file.filename);
  
  res.json({ 
    success: true, 
    message: 'Model uploaded successfully',
    modelPath: '/models/tooth.glb',
    modelName: 'tooth.glb'
  });
});

// Save annotations for a specific model
app.post('/annotations/save', express.json(), (req, res) => {
  const { modelName, annotations } = req.body;
  
  if (!modelName || !annotations) {
    return res.status(400).json({ error: 'Missing modelName or annotations' });
  }

  // Create annotations directory if it doesn't exist
  const annotationsDir = path.join(__dirname, 'data', 'models');
  if (!fs.existsSync(annotationsDir)) {
    fs.mkdirSync(annotationsDir, { recursive: true });
  }

  // Save annotations to a JSON file named after the model
  const annotationFile = path.join(annotationsDir, `${modelName}.json`);
  const data = {
    modelName,
    annotations,
    lastModified: new Date().toISOString()
  };

  try {
    fs.writeFileSync(annotationFile, JSON.stringify(data, null, 2));
    console.log(`Annotations saved for ${modelName}`);
    res.json({ success: true, message: 'Annotations saved successfully' });
  } catch (error) {
    console.error('Error saving annotations:', error);
    res.status(500).json({ error: 'Failed to save annotations' });
  }
});

// Load annotations for a specific model
app.get('/annotations/load/:modelName', (req, res) => {
  const modelName = req.params.modelName;
  const annotationFile = path.join(__dirname, 'data', 'models', `${modelName}.json`);

  try {
    if (fs.existsSync(annotationFile)) {
      const data = JSON.parse(fs.readFileSync(annotationFile, 'utf8'));
      res.json({ success: true, annotations: data.annotations });
    } else {
      // Return default annotations if no custom ones exist
      const defaultFile = path.join(__dirname, 'data', 'annotations.json');
      if (fs.existsSync(defaultFile)) {
        const defaultData = JSON.parse(fs.readFileSync(defaultFile, 'utf8'));
        res.json({ success: true, annotations: defaultData.annotations, isDefault: true });
      } else {
        res.json({ success: true, annotations: [], isDefault: true });
      }
    }
  } catch (error) {
    console.error('Error loading annotations:', error);
    res.status(500).json({ error: 'Failed to load annotations' });
  }
});

// ===== PATIENT MANAGEMENT ENDPOINTS =====

// Get tooth template (18 fixed hotspots)
app.get('/api/tooth-template', (req, res) => {
  const templateFile = path.join(__dirname, 'data', 'tooth-template.json');
  
  try {
    if (fs.existsSync(templateFile)) {
      const template = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
      res.json({ success: true, template });
    } else {
      res.status(404).json({ error: 'Tooth template not found' });
    }
  } catch (error) {
    console.error('Error loading tooth template:', error);
    res.status(500).json({ error: 'Failed to load tooth template' });
  }
});

// Create new patient
app.post('/api/patients/create', express.json(), (req, res) => {
  const { name, patientId } = req.body;
  
  if (!name || !patientId) {
    return res.status(400).json({ error: 'Name and patient ID are required' });
  }

  // Create patients directory if it doesn't exist
  const patientsDir = path.join(__dirname, 'data', 'patients');
  if (!fs.existsSync(patientsDir)) {
    fs.mkdirSync(patientsDir, { recursive: true });
  }

  const patientFile = path.join(patientsDir, `${patientId}.json`);
  
  // Check if patient already exists
  if (fs.existsSync(patientFile)) {
    return res.status(400).json({ error: 'Patient ID already exists' });
  }

  const patientData = {
    patientId,
    name,
    dateAdded: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    annotations: {}
  };

  try {
    fs.writeFileSync(patientFile, JSON.stringify(patientData, null, 2));
    console.log(`Patient created: ${patientId} - ${name}`);
    res.json({ success: true, patient: patientData });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Get all patients
app.get('/api/patients/list', (req, res) => {
  const patientsDir = path.join(__dirname, 'data', 'patients');
  
  if (!fs.existsSync(patientsDir)) {
    return res.json({ success: true, patients: [] });
  }

  try {
    const files = fs.readdirSync(patientsDir);
    const patients = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(patientsDir, file), 'utf8'));
        return {
          patientId: data.patientId,
          name: data.name,
          dateAdded: data.dateAdded,
          lastModified: data.lastModified,
          annotationCount: Object.keys(data.annotations || {}).length
        };
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json({ success: true, patients });
  } catch (error) {
    console.error('Error listing patients:', error);
    res.status(500).json({ error: 'Failed to list patients' });
  }
});

// Get specific patient data
app.get('/api/patients/:id', (req, res) => {
  const patientId = req.params.id;
  const patientFile = path.join(__dirname, 'data', 'patients', `${patientId}.json`);

  try {
    if (fs.existsSync(patientFile)) {
      const patientData = JSON.parse(fs.readFileSync(patientFile, 'utf8'));
      res.json({ success: true, patient: patientData });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error loading patient:', error);
    res.status(500).json({ error: 'Failed to load patient' });
  }
});

// Update patient info
app.put('/api/patients/:id', express.json(), (req, res) => {
  const patientId = req.params.id;
  const { name } = req.body;
  const patientFile = path.join(__dirname, 'data', 'patients', `${patientId}.json`);

  try {
    if (!fs.existsSync(patientFile)) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientData = JSON.parse(fs.readFileSync(patientFile, 'utf8'));
    patientData.name = name || patientData.name;
    patientData.lastModified = new Date().toISOString();

    fs.writeFileSync(patientFile, JSON.stringify(patientData, null, 2));
    res.json({ success: true, patient: patientData });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const patientId = req.params.id;
  const patientFile = path.join(__dirname, 'data', 'patients', `${patientId}.json`);

  try {
    if (fs.existsSync(patientFile)) {
      fs.unlinkSync(patientFile);
      console.log(`Patient deleted: ${patientId}`);
      res.json({ success: true, message: 'Patient deleted' });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Save patient annotation for specific hotspot
app.post('/api/patients/:id/annotations/:hotspotId', express.json(), (req, res) => {
  const patientId = req.params.id;
  const hotspotId = req.params.hotspotId;
  const { notes, anatomicalName } = req.body;
  const patientFile = path.join(__dirname, 'data', 'patients', `${patientId}.json`);

  try {
    if (!fs.existsSync(patientFile)) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientData = JSON.parse(fs.readFileSync(patientFile, 'utf8'));
    
    patientData.annotations[hotspotId] = {
      hotspotId: parseInt(hotspotId),
      anatomicalName,
      notes,
      lastUpdated: new Date().toISOString()
    };
    
    patientData.lastModified = new Date().toISOString();

    fs.writeFileSync(patientFile, JSON.stringify(patientData, null, 2));
    console.log(`Annotation saved for patient ${patientId}, hotspot ${hotspotId}`);
    res.json({ success: true, annotation: patientData.annotations[hotspotId] });
  } catch (error) {
    console.error('Error saving annotation:', error);
    res.status(500).json({ error: 'Failed to save annotation' });
  }
});

// Get all annotations for a patient
app.get('/api/patients/:id/annotations', (req, res) => {
  const patientId = req.params.id;
  const patientFile = path.join(__dirname, 'data', 'patients', `${patientId}.json`);

  try {
    if (!fs.existsSync(patientFile)) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientData = JSON.parse(fs.readFileSync(patientFile, 'utf8'));
    res.json({ success: true, annotations: patientData.annotations || {} });
  } catch (error) {
    console.error('Error loading annotations:', error);
    res.status(500).json({ error: 'Failed to load annotations' });
  }
});

// Delete patient annotation
app.delete('/api/patients/:id/annotations/:hotspotId', (req, res) => {
  const patientId = req.params.id;
  const hotspotId = req.params.hotspotId;
  const patientFile = path.join(__dirname, 'data', 'patients', `${patientId}.json`);

  try {
    if (!fs.existsSync(patientFile)) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientData = JSON.parse(fs.readFileSync(patientFile, 'utf8'));
    
    if (patientData.annotations[hotspotId]) {
      delete patientData.annotations[hotspotId];
      patientData.lastModified = new Date().toISOString();
      fs.writeFileSync(patientFile, JSON.stringify(patientData, null, 2));
      res.json({ success: true, message: 'Annotation deleted' });
    } else {
      res.status(404).json({ error: 'Annotation not found' });
    }
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
