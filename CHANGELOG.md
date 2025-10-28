# Changelog

All notable changes to the Dental Patient Records Management System are documented in this file.

## [2.0.0] - 2024-10-28

### Major System Overhaul

#### Added
- **Patient Management System**
  - Create and manage multiple patient records
  - Patient selection dropdown
  - Patient information display with note counts
  - Add new patient modal form
  - Individual patient JSON file storage in `data/patients/`

- **Clinical Note Recording**
  - Record clinical observations per hotspot per patient
  - Save and clear note functionality
  - Automatic timestamping of notes
  - Note count tracking per patient
  - Popup interface for note entry with anatomical information

- **18 Anatomical Hotspots**
  - Complete maxillary third molar anatomical template
  - 5 major cusps (Mesiobuccal, Distobuccal, Lingual, Mesiolingual, Distolingual)
  - 4 developmental grooves
  - 3 fossae depressions
  - 2 root anatomy points
  - 4 anatomical landmarks
  - Each with detailed descriptions and clinical significance

- **REST API Endpoints**
  - `GET /api/patients/list` - List all patients
  - `GET /api/patients/:id` - Get patient details
  - `POST /api/patients/create` - Create new patient
  - `POST /api/patients/:id/annotations/:hotspotId` - Save clinical note
  - `DELETE /api/patients/:id/annotations/:hotspotId` - Delete note
  - `GET /api/tooth-template` - Get anatomical template

#### Changed
- **UI/UX Complete Redesign**
  - Modern flat design with ergonomic styling
  - Clean medical-grade interface
  - Sidebar layout on desktop (350px control panel + main view)
  - Reduced color palette: grays and blues
  - Improved typography and spacing
  - Card-based component design
  - Subtle shadows instead of heavy gradients

- **Model Display Optimization**
  - Reduced display size from 600-700px to 400-500px
  - Better proportioned layout
  - Responsive sizing based on screen width
  - Improved viewing experience

- **Hotspot System**
  - Changed from 5 generic hotspots to 18 anatomical points
  - Accurate coordinate positioning matching GLB model dimensions
  - Scaled coordinates: X×0.25, Y×0.125, Z×0.125
  - Blue hotspot colors (#3498db) instead of red
  - Professional medical appearance

- **View Controls**
  - Fixed zoom in/out functionality using fieldOfView property
  - Zoom range: 10° to 90° field of view
  - Smooth zoom increments of 5°
  - Reset camera to 45° default view
  - Toggle hotspots visibility
  - All controls in vertical layout

#### Fixed
- **Zoom Controls** - Replaced non-functional `getCameraOrbit()` with `fieldOfView` manipulation
- **Hotspot Positioning** - Corrected coordinate scaling to match model dimensions (0.02 × 0.02 × 0.01)
- **Coordinate System** - Aligned JSON coordinates with actual GLB model space

#### Removed
- **Non-functional Features**
  - Edit mode button (was not implemented)
  - Hotspot editor panel
  - Sidebar anatomy guide (replaced with interactive hotspots)
  - Legend section (redundant with hotspot system)
  - Controls info panel (simplified)
  - Pulsing animation on hotspots
  - Multiple SEARCH/REPLACE blocks section

### Technical Improvements

#### Backend
- Express server with JSON file-based storage
- RESTful API architecture
- Patient data management
- Annotation (clinical notes) CRUD operations
- Template serving for tooth anatomy

#### Frontend
- Vanilla JavaScript (no framework dependencies)
- Google Model-Viewer 3.3.0 for 3D rendering
- Event-driven architecture
- Modular code organization
- Proper error handling

#### Data Structure
- `tooth-template.json` - Anatomical reference template
- `patients/[ID].json` - Individual patient records
- Normalized data structure for scalability

### Model Specifications

- **Format:** GLB (GLTF 2.0 Binary)
- **Vertices:** 2,437
- **Triangles:** 4,634
- **Dimensions:** 0.02 × 0.02 × 0.01 units
- **Type:** Maxillary Third Molar (Wisdom Tooth)

### Browser Support

- Chrome 85+
- Firefox 78+
- Safari 14+
- Edge 85+

---

## [1.0.0] - Initial Release

### Features
- Basic 3D tooth model viewer
- 5 generic annotation hotspots
- Simple viewer controls
- STL to GLB conversion utility
- Static annotation display

### Technologies
- Node.js + Express
- Google Model-Viewer
- Three.js for STL conversion
- Basic HTML/CSS/JavaScript

---

## Notes

### Version Numbering
This project uses [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

### Future Roadmap
See README.md for planned enhancements including:
- PDF report generation
- Image attachments
- Multi-tooth visualization
- Database integration
- User authentication
- Treatment planning tools
