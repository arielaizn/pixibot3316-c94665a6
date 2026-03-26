/**
 * Pixibot ExtendScript for Adobe After Effects
 * Provides automation functions for importing and editing
 */

// Test function
function helloWorld() {
  return JSON.stringify({ message: "Hello from After Effects!", version: app.version });
}

/**
 * Import files to After Effects
 * @param {string} filesJson - JSON string of files array
 * @param {string} folderName - Name of folder to create
 * @returns {string} JSON result
 */
function importFilesToAfterEffects(filesJson, folderName) {
  try {
    var files = JSON.parse(filesJson);
    var project = app.project;

    // Create folder
    var folder = project.items.addFolder(folderName);

    var results = [];
    for (var i = 0; i < files.length; i++) {
      try {
        var importOptions = new ImportOptions(File(files[i].localPath));
        var item = project.importFile(importOptions);
        item.parentFolder = folder;
        results.push({ name: files[i].name, success: true });
      } catch (err) {
        results.push({ name: files[i].name, success: false, error: err.toString() });
      }
    }

    return JSON.stringify({ success: true, imported: results, folderName: folderName });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

/**
 * Import files to After Effects organized by category folders
 * @param {string} payloadJson - JSON string with { categorizedFiles, projectName }
 * @returns {string} JSON result
 */
function importFilesToAfterEffectsOrganized(payloadJson) {
  try {
    var payload = JSON.parse(payloadJson);
    var categorizedFiles = payload.categorizedFiles;
    var projectName = payload.projectName;
    var project = app.project;

    // Create root folder for the project
    var projectFolder = project.items.addFolder(projectName);

    var categoryNames = {
      'final': 'Final Videos',
      'images': 'Images',
      'animations': 'Animations',
      'music': 'Music',
      'narration': 'Narration'
    };

    var results = [];

    for (var category in categorizedFiles) {
      if (!categorizedFiles.hasOwnProperty(category)) continue;

      var files = categorizedFiles[category];
      if (!files || files.length === 0) continue;

      // Create sub-folder for this category
      var folderName = categoryNames[category] || category;
      var categoryFolder = project.items.addFolder(folderName);
      categoryFolder.parentFolder = projectFolder;

      // Import each file
      for (var i = 0; i < files.length; i++) {
        try {
          var importOptions = new ImportOptions(File(files[i].localPath));
          var item = project.importFile(importOptions);
          item.parentFolder = categoryFolder;
          results.push({ name: files[i].name, category: category, success: true });
        } catch (err) {
          results.push({ name: files[i].name, category: category, success: false, error: err.toString() });
        }
      }
    }

    return JSON.stringify({
      success: true,
      imported: results,
      projectName: projectName
    });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

/**
 * Create composition from imported footage
 * @param {string} folderName - Folder containing footage
 * @param {string} compName - Name for new composition
 * @returns {string} JSON result
 */
function createCompositionFromImport(folderName, compName) {
  try {
    var folder = findFolderByName(folderName);
    if (!folder) {
      return JSON.stringify({ success: false, error: 'Folder not found: ' + folderName });
    }

    // Create 1920x1080 30fps 10sec comp
    var comp = app.project.items.addComp(compName, 1920, 1080, 1.0, 10.0, 30);

    // Add items to comp
    var currentTime = 0;
    for (var i = 1; i <= folder.numItems; i++) {
      var item = folder.item(i);
      if (item instanceof FootageItem) {
        var layer = comp.layers.add(item);
        layer.startTime = currentTime;
        if (item.duration > 0) {
          currentTime += item.duration;
        }
      }
    }

    return JSON.stringify({ success: true, compName: compName, message: 'Composition created' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function findFolderByName(name) {
  for (var i = 1; i <= app.project.items.length; i++) {
    var item = app.project.items[i];
    if (item.name === name && item instanceof FolderItem) {
      return item;
    }
  }
  return null;
}

/**
 * Execute Edit Agent command
 * @param {string} commandJson - JSON command object
 * @returns {string} JSON result
 */
function executeEditCommand(commandJson) {
  try {
    var command = JSON.parse(commandJson);

    switch (command.type) {
      case 'add_text':
        return addTextLayer(command.payload);
      case 'create_layer':
        return createLayer(command.payload);
      case 'add_shape':
        return addShapeLayer(command.payload);
      case 'add_effect':
        return addEffect(command.payload);
      case 'update_clip':
        return updateLayer(command.payload);
      case 'remove_clip':
        return removeLayer(command.payload);
      case 'trim_clip':
        return trimLayer(command.payload);
      case 'autonomous':
        return executeAutonomous(command.payload);
      default:
        return JSON.stringify({ success: false, error: 'Unknown command: ' + command.type });
    }
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function addTextLayer(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    var textLayer = comp.layers.addText(params.text || 'Text');
    var textProp = textLayer.property("Source Text");
    var textDoc = textProp.value;

    textDoc.fontSize = params.fontSize || 60;
    textDoc.fillColor = params.color || [1, 1, 1];
    textDoc.font = params.font || "Arial";
    textProp.setValue(textDoc);

    if (params.position === 'center') {
      textLayer.property("Position").setValue([comp.width / 2, comp.height / 2]);
    }

    if (typeof params.time !== 'undefined') {
      textLayer.startTime = params.time;
    }

    return JSON.stringify({ success: true, message: 'Text layer added: ' + params.text });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function addShapeLayer(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = params.name || "Shape";

    var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");

    if (params.shape === 'rectangle' || !params.shape) {
      var rect = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
      rect.property("Size").setValue([params.width || 100, params.height || 100]);
    } else if (params.shape === 'ellipse') {
      var ellipse = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
      ellipse.property("Size").setValue([params.width || 100, params.height || 100]);
    }

    var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
    fill.property("Color").setValue(params.color || [1, 0, 0, 1]);

    return JSON.stringify({ success: true, message: 'Shape layer created' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function addEffect(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    var layer = comp.layer(params.layerIndex || 1);
    if (!layer) {
      return JSON.stringify({ success: false, error: 'Layer not found' });
    }

    var effectName = params.effect || 'Gaussian Blur';
    var effect = layer.Effects.addProperty(effectName);

    if (effect) {
      return JSON.stringify({ success: true, message: effectName + ' effect added' });
    } else {
      return JSON.stringify({ success: false, error: 'Failed to add effect: ' + effectName });
    }
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function createLayer(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    var layerType = params.type || 'solid';
    var layer;

    if (layerType === 'solid') {
      layer = comp.layers.addSolid(
        params.color || [1, 0, 0],
        params.name || "Solid",
        comp.width,
        comp.height,
        1.0
      );
    } else if (layerType === 'null') {
      layer = comp.layers.addNull();
      layer.name = params.name || "Null";
    }

    return JSON.stringify({ success: true, message: 'Layer created: ' + layerType });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function updateLayer(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    var layer = comp.layer(params.clipIndex || 1);
    if (!layer) {
      return JSON.stringify({ success: false, error: 'Layer not found' });
    }

    var updates = params.updates || {};
    var messages = [];

    // Scale
    if (typeof updates.scale !== 'undefined') {
      var scaleValue = updates.scale * 100;
      layer.property("Scale").setValue([scaleValue, scaleValue]);
      messages.push('scaled to ' + scaleValue + '%');
    }

    // Rotation
    if (typeof updates.rotate !== 'undefined') {
      layer.property("Rotation").setValue(updates.rotate);
      messages.push('rotated ' + updates.rotate + ' degrees');
    }

    // Opacity
    if (typeof updates.opacity !== 'undefined') {
      layer.property("Opacity").setValue(updates.opacity);
      messages.push('opacity set to ' + updates.opacity + '%');
    }

    // Position
    if (updates.position) {
      layer.property("Position").setValue([updates.position.x, updates.position.y]);
      messages.push('position updated');
    }

    return JSON.stringify({
      success: true,
      message: 'Layer updated: ' + messages.join(', ')
    });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function removeLayer(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    if (params.clipId === 'all') {
      // Remove all layers
      while (comp.layers.length > 0) {
        comp.layer(1).remove();
      }
      return JSON.stringify({ success: true, message: 'All layers removed' });
    }

    if (params.clipId === 'last') {
      // Remove last layer
      if (comp.layers.length > 0) {
        comp.layer(comp.layers.length).remove();
        return JSON.stringify({ success: true, message: 'Last layer removed' });
      }
      return JSON.stringify({ success: false, error: 'No layers to remove' });
    }

    // Remove layer by index
    var layerIndex = parseInt(params.clipId) || params.layerIndex || 1;
    var layer = comp.layer(layerIndex);
    if (layer) {
      layer.remove();
      return JSON.stringify({ success: true, message: 'Layer removed' });
    }

    return JSON.stringify({ success: false, error: 'Layer not found' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function trimLayer(params) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ success: false, error: 'No active composition' });
    }

    var layer = comp.layer(params.clipIndex || 1);
    if (!layer) {
      return JSON.stringify({ success: false, error: 'Layer not found' });
    }

    if (typeof params.startTime !== 'undefined') {
      layer.inPoint = params.startTime;
    }

    if (typeof params.endTime !== 'undefined') {
      layer.outPoint = params.endTime;
    }

    return JSON.stringify({ success: true, message: 'Layer trimmed' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function executeAutonomous(params) {
  try {
    var results = [];
    for (var i = 0; i < params.steps.length; i++) {
      var step = params.steps[i];
      var result = executeEditCommand(JSON.stringify(step));
      results.push(JSON.parse(result));
    }

    return JSON.stringify({ success: true, results: results, message: 'Autonomous editing completed' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}
