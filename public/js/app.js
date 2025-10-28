// ===== PATIENT MANAGEMENT SYSTEM FOR MAXILLARY THIRD MOLAR =====

// Global state
let toothTemplate = null;
let currentPatient = null;
let patients = [];
const modelViewer = document.getElementById('tooth-model');
const popup = document.getElementById('info-popup');
const popupTitle = document.getElementById('popup-title');
const popupDescription = document.getElementById('popup-description');

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Patient Management System...');
  
  // Load tooth template
  await loadToothTemplate();
  
  // Load patients list
  await loadPatients();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up control buttons
  setupControlButtons();
  
  console.log('System initialized successfully');
});

// ===== TOOTH TEMPLATE =====

async function loadToothTemplate() {
  try {
    const response = await fetch('/api/tooth-template');
    const result = await response.json();
    
    if (result.success) {
      toothTemplate = result.template;
      console.log(`Loaded tooth template with ${toothTemplate.hotspots.length} hotspots`);
      
      // Generate hotspots from template (but don't show patient notes yet)
      generateHotspotsFromTemplate();
    } else {
      console.error('Failed to load tooth template');
      alert('Error loading tooth template. Please refresh the page.');
    }
  } catch (error) {
    console.error('Error loading tooth template:', error);
    alert('Error loading tooth template. Please refresh the page.');
  }
}

function generateHotspotsFromTemplate() {
  if (!toothTemplate || !modelViewer) return;
  
  // Clear existing hotspots
  const existingHotspots = modelViewer.querySelectorAll('.hotspot');
  existingHotspots.forEach(h => h.remove());
  
  // Generate new hotspots from template
  toothTemplate.hotspots.forEach((hotspot, index) => {
    const button = document.createElement('button');
    button.className = 'hotspot';
    button.setAttribute('slot', `hotspot-${hotspot.id}`);
    button.setAttribute('data-position', `${hotspot.position.x} ${hotspot.position.y} ${hotspot.position.z}`);
    button.setAttribute('data-normal', `${hotspot.normal.x} ${hotspot.normal.y} ${hotspot.normal.z}`);
    button.setAttribute('data-hotspot-id', hotspot.id);
    
    const annotationDiv = document.createElement('div');
    annotationDiv.className = 'hotspot-annotation';
    annotationDiv.textContent = hotspot.id;
    
    button.appendChild(annotationDiv);
    modelViewer.appendChild(button);
    
    // Add click event
    button.addEventListener('click', (e) => {
      e.preventDefault();
      handleHotspotClick(hotspot.id);
    });
  });
  
  console.log(`Generated ${toothTemplate.hotspots.length} hotspots on model`);
}

// ===== PATIENT MANAGEMENT =====

async function loadPatients() {
  try {
    const response = await fetch('/api/patients/list');
    const result = await response.json();
    
    if (result.success) {
      patients = result.patients;
      updatePatientSelector();
      console.log(`Loaded ${patients.length} patients`);
    } else {
      console.error('Failed to load patients');
    }
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

function updatePatientSelector() {
  const select = document.getElementById('patient-select');
  if (!select) return;
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">-- Select Patient --</option>';
  
  // Add patient options
  patients.forEach(patient => {
    const option = document.createElement('option');
    option.value = patient.patientId;
    option.textContent = `${patient.name} (${patient.patientId})`;
    select.appendChild(option);
  });
  
  // Auto-select if only one patient
  if (patients.length === 1) {
    select.value = patients[0].patientId;
    selectPatient(patients[0].patientId);
  }
}

async function selectPatient(patientId) {
  if (!patientId) {
    currentPatient = null;
    document.getElementById('patient-info').classList.add('hidden');
    return;
  }
  
  try {
    const response = await fetch(`/api/patients/${patientId}`);
    const result = await response.json();
    
    if (result.success) {
      currentPatient = result.patient;
      updatePatientInfo();
      console.log(`Selected patient: ${currentPatient.name}`);
    } else {
      alert('Failed to load patient data');
    }
  } catch (error) {
    console.error('Error loading patient:', error);
    alert('Error loading patient data');
  }
}

function updatePatientInfo() {
  if (!currentPatient) return;
  
  const infoDiv = document.getElementById('patient-info');
  const displaySpan = document.getElementById('patient-display');
  const countSpan = document.getElementById('patient-notes-count');
  
  if (infoDiv && displaySpan && countSpan) {
    displaySpan.textContent = `Patient: ${currentPatient.name} (${currentPatient.patientId})`;
    const noteCount = Object.keys(currentPatient.annotations || {}).length;
    countSpan.textContent = `${noteCount} notes recorded`;
    infoDiv.classList.remove('hidden');
  }
  
  // Update notes display
  displayPatientNotes();
}

function displayPatientNotes() {
  const notesPanel = document.getElementById('patient-notes-panel');
  const emptyState = document.getElementById('notes-empty-state');
  const notesList = document.getElementById('patient-notes-list');
  
  if (!notesPanel || !emptyState || !notesList) return;
  
  if (!currentPatient) {
    notesPanel.classList.add('hidden');
    return;
  }
  
  // Show the notes panel
  notesPanel.classList.remove('hidden');
  
  const annotations = currentPatient.annotations || {};
  const noteCount = Object.keys(annotations).length;
  
  if (noteCount === 0) {
    // Show empty state
    emptyState.style.display = 'block';
    notesList.innerHTML = '';
  } else {
    // Hide empty state and show notes
    emptyState.style.display = 'none';
    
    // Build notes HTML
    let notesHTML = '';
    
    // Sort notes by hotspot ID
    const sortedNotes = Object.entries(annotations).sort((a, b) => {
      return parseInt(a[0]) - parseInt(b[0]);
    });
    
    sortedNotes.forEach(([hotspotId, note]) => {
      const hotspot = toothTemplate.hotspots.find(h => h.id === parseInt(hotspotId));
      const anatomicalName = hotspot ? hotspot.name : note.anatomicalName || 'Unknown';
      const date = new Date(note.lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      notesHTML += `
        <div class="note-item">
          <div class="note-item-header">
            <div class="note-item-title">
              <span class="note-item-number">${hotspotId}</span>
              ${anatomicalName}
            </div>
            <div class="note-item-date">${date}</div>
          </div>
          <div class="note-item-content">${note.notes}</div>
          <div class="note-item-actions">
            <button class="btn-note-edit" onclick="editNote(${hotspotId})">Edit</button>
            <button class="btn-note-delete" onclick="deleteNote(${hotspotId})">Delete</button>
          </div>
        </div>
      `;
    });
    
    notesList.innerHTML = notesHTML;
  }
}

// Make note functions globally available
window.editNote = function(hotspotId) {
  if (!currentPatient) return;
  
  const hotspot = toothTemplate.hotspots.find(h => h.id === hotspotId);
  if (!hotspot) return;
  
  const existingNote = currentPatient.annotations[hotspotId];
  showPatientNotePopup(hotspot, existingNote);
};

window.deleteNote = async function(hotspotId) {
  if (!currentPatient) return;
  
  if (!confirm('Are you sure you want to delete this clinical note?')) {
    return;
  }
  
  await clearPatientNote(hotspotId);
};

function showAddPatientModal() {
  const modal = document.getElementById('add-patient-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('new-patient-name').focus();
  }
}

function hideAddPatientModal() {
  const modal = document.getElementById('add-patient-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('add-patient-form').reset();
  }
}

async function createNewPatient(name, patientId) {
  try {
    const response = await fetch('/api/patients/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, patientId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Created new patient: ${name} (${patientId})`);
      
      // Reload patients and select the new one
      await loadPatients();
      document.getElementById('patient-select').value = patientId;
      await selectPatient(patientId);
      
      hideAddPatientModal();
      alert(`Patient ${name} created successfully!`);
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('Error creating patient:', error);
    alert('Error creating patient');
  }
}

// ===== HOTSPOT INTERACTION =====

function handleHotspotClick(hotspotId) {
  if (!currentPatient) {
    alert('Please select a patient first');
    return;
  }
  
  // Find hotspot data from template
  const hotspot = toothTemplate.hotspots.find(h => h.id === hotspotId);
  if (!hotspot) return;
  
  // Get patient's existing note for this hotspot
  const existingNote = currentPatient.annotations[hotspotId];
  
  showPatientNotePopup(hotspot, existingNote);
}

function showPatientNotePopup(hotspot, existingNote) {
  // Build popup content
  popupTitle.textContent = hotspot.name;
  
  // Create popup content with patient notes
  popupDescription.innerHTML = `
    <div style="margin-bottom: 15px;">
      <strong>Anatomical Description:</strong><br>
      <span style="color: #666;">${hotspot.description}</span>
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong>Clinical Significance:</strong><br>
      <span style="color: #666;">${hotspot.clinical_significance}</span>
    </div>
    
    <div style="margin-bottom: 10px;">
      <strong>Clinical Notes for ${currentPatient.name}:</strong>
    </div>
    
    <textarea id="patient-note-input" 
              style="width: 100%; min-height: 100px; padding: 10px; 
                     border: 2px solid #e3f2fd; border-radius: 8px; 
                     font-family: inherit; font-size: 0.95rem;"
              placeholder="Enter your clinical observations here...">${existingNote ? existingNote.notes : ''}</textarea>
    
    <div style="margin-top: 15px; display: flex; gap: 10px;">
      <button onclick="savePatientNote(${hotspot.id}, '${hotspot.name}')" 
              style="flex: 1; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); 
                     color: white; border: none; border-radius: 8px; padding: 10px 20px; 
                     font-weight: 600; cursor: pointer;">
        Save Notes
      </button>
      <button onclick="clearPatientNote(${hotspot.id})" 
              style="background: linear-gradient(135deg, #ef5350 0%, #e53935 100%); 
                     color: white; border: none; border-radius: 8px; padding: 10px 20px; 
                     font-weight: 600; cursor: pointer;">
        Clear
      </button>
    </div>
    
    ${existingNote ? `<div style="margin-top: 10px; font-size: 0.85rem; color: #999;">
      Last updated: ${new Date(existingNote.lastUpdated).toLocaleString()}
    </div>` : ''}
  `;
  
  // Show popup
  popup.classList.remove('hidden');
  popup.classList.add('visible');
  
  // Pause auto-rotation
  if (modelViewer) {
    modelViewer.autoRotate = false;
  }
}

async function savePatientNote(hotspotId, anatomicalName) {
  const noteInput = document.getElementById('patient-note-input');
  if (!noteInput || !currentPatient) return;
  
  const notes = noteInput.value.trim();
  
  if (!notes) {
    alert('Please enter some notes before saving');
    return;
  }
  
  try {
    const response = await fetch(`/api/patients/${currentPatient.patientId}/annotations/${hotspotId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes,
        anatomicalName
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Saved note for hotspot ${hotspotId}`);
      
      // Update local patient data
      currentPatient.annotations[hotspotId] = result.annotation;
      updatePatientInfo();
      
      closePopup();
      alert('Notes saved successfully!');
    } else {
      alert('Error saving notes: ' + result.error);
    }
  } catch (error) {
    console.error('Error saving note:', error);
    alert('Error saving notes');
  }
}

async function clearPatientNote(hotspotId) {
  if (!currentPatient) return;
  
  if (!confirm('Are you sure you want to clear these notes?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/patients/${currentPatient.patientId}/annotations/${hotspotId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Cleared note for hotspot ${hotspotId}`);
      
      // Update local patient data
      delete currentPatient.annotations[hotspotId];
      updatePatientInfo();
      
      closePopup();
      alert('Notes cleared');
    } else {
      alert('Error clearing notes: ' + result.error);
    }
  } catch (error) {
    console.error('Error clearing note:', error);
    alert('Error clearing notes');
  }
}

// Make functions globally available
window.savePatientNote = savePatientNote;
window.clearPatientNote = clearPatientNote;

function closePopup() {
  popup.classList.remove('visible');
  popup.classList.add('hidden');
  
  // Resume auto-rotation
  if (modelViewer) {
    modelViewer.autoRotate = true;
  }
}

window.closePopup = closePopup;

// ===== EVENT LISTENERS =====

function setupEventListeners() {
  // Patient selector
  const patientSelect = document.getElementById('patient-select');
  if (patientSelect) {
    patientSelect.addEventListener('change', (e) => {
      selectPatient(e.target.value);
    });
  }
  
  // Add patient button
  const addPatientBtn = document.getElementById('add-patient-btn');
  if (addPatientBtn) {
    addPatientBtn.addEventListener('click', showAddPatientModal);
  }
  
  // Add patient form
  const addPatientForm = document.getElementById('add-patient-form');
  if (addPatientForm) {
    addPatientForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-patient-name').value.trim();
      const patientId = document.getElementById('new-patient-id').value.trim();
      
      if (name && patientId) {
        createNewPatient(name, patientId);
      }
    });
  }
  
  // Cancel add patient
  const cancelAddPatient = document.getElementById('cancel-add-patient');
  if (cancelAddPatient) {
    cancelAddPatient.addEventListener('click', hideAddPatientModal);
  }
  
  // Close popup when clicking outside
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });
  
  // Close popup with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('visible')) {
      closePopup();
    }
  });
  
  // Model loading events
  if (modelViewer) {
    modelViewer.addEventListener('load', () => {
      console.log('3D model loaded successfully!');
    });
    
    modelViewer.addEventListener('error', (error) => {
      console.error('Error loading 3D model:', error);
    });
  }
}

// ===== CAMERA CONTROLS =====

function setupControlButtons() {
  const resetBtn = document.getElementById('reset-camera');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const toggleBtn = document.getElementById('toggle-hotspots');
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetCamera);
  }
  
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', zoomIn);
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', zoomOut);
  }
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleHotspots);
  }
}

function resetCamera() {
  if (modelViewer) {
    modelViewer.cameraOrbit = '45deg 75deg auto';
    modelViewer.fieldOfView = '45deg';
  }
}

function zoomIn() {
  if (modelViewer) {
    // Decrease field of view to zoom in (min 10deg)
    const currentFOV = parseFloat(modelViewer.fieldOfView) || 45;
    const newFOV = Math.max(currentFOV - 5, 10);
    modelViewer.fieldOfView = `${newFOV}deg`;
  }
}

function zoomOut() {
  if (modelViewer) {
    // Increase field of view to zoom out (max 90deg)
    const currentFOV = parseFloat(modelViewer.fieldOfView) || 45;
    const newFOV = Math.min(currentFOV + 5, 90);
    modelViewer.fieldOfView = `${newFOV}deg`;
  }
}

let hotspotsVisible = true;

function toggleHotspots() {
  const hotspots = document.querySelectorAll('.hotspot');
  const toggleBtn = document.getElementById('toggle-hotspots');
  
  hotspotsVisible = !hotspotsVisible;
  
  hotspots.forEach(hotspot => {
    if (hotspotsVisible) {
      hotspot.classList.remove('hidden');
    } else {
      hotspot.classList.add('hidden');
    }
  });
  
  if (toggleBtn) {
    if (hotspotsVisible) {
      toggleBtn.classList.remove('active');
    } else {
      toggleBtn.classList.add('active');
    }
  }
}

console.log('Patient Management System loaded');
