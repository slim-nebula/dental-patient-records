# Dental Patient Records Management System

A web-based dental application for managing patient records with an interactive 3D maxillary third molar model featuring 18 anatomical annotation points for clinical observations.

## Features

- 🦷 **Interactive 3D Tooth Model** - Maxillary third molar with realistic rendering
- 📍 **18 Anatomical Hotspots** - Clickable markers at key anatomical locations
- 👥 **Patient Management** - Create and manage multiple patient records
- 📝 **Clinical Notes** - Record observations for each anatomical point per patient
- 🎨 **Modern UI** - Clean, ergonomic medical-grade interface
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **View Controls** - Zoom, rotate, pan, and toggle hotspot visibility
- 💾 **Data Persistence** - JSON-based storage for patient records

## Requirements

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
tooth/
├── models/                      # 3D model files
│   └── tooth.glb               # GLB format 3D tooth model
├── public/                     # Frontend files
│   ├── index.html              # Main application HTML
│   ├── css/
│   │   └── style.css           # Modern styling
│   ├── js/
│   │   └── app.js              # Application logic
│   └── models/
│       └── tooth.glb           # Public model copy
├── data/                       # Application data
│   ├── tooth-template.json     # 18 hotspot anatomical template
│   └── patients/               # Patient records (auto-generated)
│       └── P001.json           # Individual patient files
├── server.js                   # Express server with REST API
├── package.json                # Project dependencies
└── README.md                   # This file
```

## Usage

### Patient Management

1. **Select a Patient:**
   - Use the dropdown to select an existing patient
   - Click "Add New Patient" to create a new record

2. **Recording Clinical Observations:**
   - Select a patient first
   - Click any hotspot (numbered markers) on the 3D model
   - View anatomical description and clinical significance
   - Enter clinical observations in the notes field
   - Click "Save Notes" to store the observation

3. **Managing Notes:**
   - Notes are automatically timestamped
   - Patient info shows total number of recorded notes
   - Click "Clear" to remove notes for a specific hotspot

### 3D Model Controls

- **Rotate:** Click and drag on the model
- **Zoom:** 
  - Use mouse wheel or pinch gesture
  - Use "Zoom In" and "Zoom Out" buttons
- **Pan:** Right-click and drag (two-finger drag on mobile)
- **Reset Camera:** Return to default view position
- **Toggle Hotspots:** Show/hide anatomical markers

### 18 Anatomical Hotspots

The maxillary third molar template includes:

**Major Cusps:**
1. Mesiobuccal Cusp
2. Distobuccal Cusp  
3. Lingual Cusp
8. Mesiolingual Cusp
9. Distolingual Cusp

**Grooves:**
4. Buccal Developmental Groove
6. Supplementary Grooves
10. Central Developmental Groove
11. Lingual Developmental Groove

**Depressions:**
5. Central Fossa
12. Mesial Triangular Fossa
13. Distal Triangular Fossa

**Root Anatomy:**
7. Fused Root
18. Root Apex

**Landmarks:**
14. Cervical Line (CEJ)
15. Occlusal Table
16. Mesial Marginal Ridge
17. Distal Marginal Ridge

## Technical Details

### Model Specifications

- **Format:** GLB (GL Transmission Format)
- **Dimensions:** 
  - X: 0.02 units
  - Y: 0.02 units
  - Z: 0.01 units
- **Vertices:** 2,437
- **Triangles:** 4,634

### Coordinate System

The hotspot positions are defined in model space coordinates:
- Origin at model center
- Y-axis points up (crown to root)
- X-axis left/right (mesial/distal)
- Z-axis front/back (buccal/lingual)

### API Endpoints

**Patient Management:**
- `GET /api/patients/list` - List all patients
- `GET /api/patients/:id` - Get patient record
- `POST /api/patients/create` - Create new patient
- `POST /api/patients/:id/annotations/:hotspotId` - Save clinical note
- `DELETE /api/patients/:id/annotations/:hotspotId` - Delete note

**Template:**
- `GET /api/tooth-template` - Get anatomical template with 18 hotspots

### Data Structure

**Patient Record (`data/patients/P001.json`):**
```json
{
  "patientId": "P001",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "annotations": {
    "1": {
      "notes": "Clinical observation text",
      "anatomicalName": "Mesiobuccal Cusp",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Tooth Template (`data/tooth-template.json`):**
```json
{
  "tooth_type": "maxillary_third_molar",
  "hotspots": [
    {
      "id": 1,
      "name": "Mesiobuccal Cusp",
      "type": "cusp",
      "position": { "x": 0.0075, "y": 0.01, "z": 0.00375 },
      "normal": { "x": 0.5, "y": 0.7, "z": 0.5 },
      "description": "Anatomical description",
      "clinical_significance": "Clinical importance"
    }
  ]
}
```

## Customization

### Adjusting Hotspot Positions

To reposition hotspots to match different tooth models:

1. Open `data/tooth-template.json`
2. Modify the `position` values (scaled to match your model dimensions)
3. Coordinates must match the actual GLB model size
4. Save and refresh the browser

**Scaling Formula:**
- If your model is different size, scale all coordinates proportionally
- Current model: X=0.02, Y=0.02, Z=0.01
- New coordinates = old coordinates × (new model size / 0.02)

### Styling

Edit `public/css/style.css` to customize:
- Color scheme (currently modern flat design)
- Layout (sidebar + main view on desktop)
- Model display size (400-500px default)
- Typography and spacing

### Adding New Hotspots

1. Add entry to `tooth-template.json` hotspots array
2. Assign unique `id` number
3. Set `position` coordinates based on model
4. Add `name`, `description`, and `clinical_significance`
5. Hotspots automatically render on page load

## Troubleshooting

### Model doesn't load
- Check that `public/models/tooth.glb` exists
- Verify file permissions
- Check browser console for errors

### Hotspots in wrong position
- Verify model dimensions match coordinate scaling
- Check `data/tooth-template.json` position values
- Ensure GLB model is centered at origin

### Zoom not working
- Clear browser cache
- Check console for JavaScript errors
- Verify model-viewer loaded successfully

### Port 3000 in use
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

## Technologies Used

- **Backend:** Node.js, Express
- **3D Rendering:** Google Model-Viewer 3.3.0
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Data Storage:** JSON file system
- **Model Format:** GLB (GLTF 2.0 binary)

## Browser Compatibility

- Chrome 85+
- Firefox 78+
- Safari 14+
- Edge 85+

## Model Information

The included maxillary third molar model represents:
- Adult maxillary third molar (wisdom tooth)
- Typical 3-4 cusp morphology
- Fused root structure
- Multiple grooves and fossae for educational detail

## Future Enhancements

- [ ] Export patient reports to PDF
- [ ] Image attachment support
- [ ] Multi-tooth visualization
- [ ] Comparison views (left vs right)
- [ ] Treatment planning tools
- [ ] Database integration (SQLite/PostgreSQL)
- [ ] User authentication
- [ ] Appointment scheduling

## License

MIT License - Free to use and modify for educational and clinical purposes.

## Contributing

Contributions welcome! Please submit issues or pull requests.

## Support

For issues or questions, please create a GitHub issue.

## Acknowledgments

- Model format support via Google Model-Viewer
- Dental anatomy references from standard texts
- Clinical significance descriptions for educational purposes
