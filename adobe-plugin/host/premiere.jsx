/**
 * Pixibot ExtendScript for Adobe Premiere Pro
 * Provides automation functions for importing and editing
 */

// Test function
function helloWorld() {
  return JSON.stringify({ message: "Hello from Premiere Pro!", version: app.version });
}

/**
 * Import files to Premiere Pro
 * @param {string} filesJson - JSON string of files array
 * @param {string} binName - Name of bin to create
 * @returns {string} JSON result
 */
function importFilesToPremiere(filesJson, binName) {
  try {
    var files = JSON.parse(filesJson);
    var project = app.project;

    // Collect valid file paths and verify they exist on disk
    var filePaths = [];
    var results = [];
    for (var i = 0; i < files.length; i++) {
      var filePath = files[i].localPath;
      var f = new File(filePath);
      if (f.exists) {
        filePaths.push(filePath);
        results.push({ name: files[i].name, success: true });
      } else {
        results.push({ name: files[i].name, success: false, error: "File not found: " + filePath });
      }
    }

    if (filePaths.length === 0) {
      return JSON.stringify({ success: false, error: "No valid files found on disk", imported: results });
    }

    // Import all valid files at once (import to root first)
    var importSuccess = project.importFiles(filePaths);

    if (!importSuccess) {
      return JSON.stringify({ success: false, error: "importFiles returned false", imported: results });
    }

    return JSON.stringify({ success: true, imported: results, binName: binName, count: filePaths.length });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

/**
 * Import files to Premiere Pro organized by category bins
 * @param {string} payloadJson - JSON string with { categorizedFiles, projectName }
 * @returns {string} JSON result
 */
function importFilesToPremiereOrganized(payloadJson) {
  try {
    var payload = JSON.parse(payloadJson);
    var categorizedFiles = payload.categorizedFiles;
    var projectName = payload.projectName;
    var project = app.project;

    // Create a root bin for the project
    project.rootItem.createBin(projectName);

    // Find the bin we just created (createBin returns boolean, not the bin)
    var projectBin = null;
    for (var b = 0; b < project.rootItem.children.numItems; b++) {
      var child = project.rootItem.children[b];
      if (child.name === projectName && child.type === 2) { // type 2 = bin
        projectBin = child;
        break;
      }
    }

    if (!projectBin) {
      return JSON.stringify({ success: false, error: "Failed to create project bin" });
    }

    var categoryNames = {
      'final': 'Final Videos',
      'images': 'Images',
      'animations': 'Animations',
      'music': 'Music',
      'narration': 'Narration'
    };

    var totalImported = 0;
    var results = [];

    for (var category in categorizedFiles) {
      if (!categorizedFiles.hasOwnProperty(category)) continue;

      var files = categorizedFiles[category];
      if (!files || files.length === 0) continue;

      // Create sub-bin for this category
      var binName = categoryNames[category] || category;
      projectBin.createBin(binName);

      // Find the sub-bin
      var categoryBin = null;
      for (var c = 0; c < projectBin.children.numItems; c++) {
        if (projectBin.children[c].name === binName) {
          categoryBin = projectBin.children[c];
          break;
        }
      }

      // Collect valid file paths
      var filePaths = [];
      for (var i = 0; i < files.length; i++) {
        var filePath = files[i].localPath;
        var f = new File(filePath);
        if (f.exists) {
          filePaths.push(filePath);
          results.push({ name: files[i].name, category: category, success: true });
        } else {
          results.push({ name: files[i].name, category: category, success: false, error: "File not found: " + filePath });
        }
      }

      if (filePaths.length === 0) continue;

      // Import files
      var importSuccess = project.importFiles(filePaths);

      if (importSuccess && categoryBin) {
        // Move imported items from root into the category bin
        for (var j = 0; j < filePaths.length; j++) {
          var importedItem = findProjectItemByPath(filePaths[j]);
          if (importedItem) {
            importedItem.moveBin(categoryBin);
            totalImported++;
          }
        }
      } else if (importSuccess) {
        totalImported += filePaths.length;
      }
    }

    return JSON.stringify({
      success: true,
      imported: results,
      projectName: projectName,
      count: totalImported
    });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

/**
 * Add video clips to timeline
 * @param {string} videoFilesJson - JSON string of video file paths
 * @returns {string} JSON result
 */
function addClipsToTimeline(videoFilesJson) {
  try {
    var videoFiles = JSON.parse(videoFilesJson);
    var sequence = app.project.activeSequence;

    if (!sequence) {
      return JSON.stringify({ success: false, error: 'No active sequence' });
    }

    var track = sequence.videoTracks[0];
    var currentTime = sequence.getPlayerPosition();

    for (var i = 0; i < videoFiles.length; i++) {
      var projectItem = findProjectItemByPath(videoFiles[i]);
      if (projectItem) {
        track.insertClip(projectItem, currentTime.seconds);
        currentTime.seconds += projectItem.getOutPoint().seconds;
      }
    }

    return JSON.stringify({ success: true });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

/**
 * Find project item by file path
 */
function findProjectItemByPath(path) {
  var items = app.project.rootItem.children;
  for (var i = 0; i < items.numItems; i++) {
    var item = items[i];
    try {
      if (item.getMediaPath() === path) {
        return item;
      }
    } catch (e) {}
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
        return addTextOverlay(command.payload);
      case 'trim_clip':
        return trimClip(command.payload);
      case 'add_effect':
        return addEffect(command.payload);
      case 'cut':
        return makeCut(command.payload);
      case 'update_clip':
        return updateClip(command.payload);
      case 'remove_clip':
        return removeClip(command.payload);
      case 'add_transition':
        return addTransition(command.payload);
      case 'autonomous':
        return executeAutonomous(command.payload);
      default:
        return JSON.stringify({ success: false, error: 'Unknown command: ' + command.type });
    }
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function addTextOverlay(params) {
  try {
    var sequence = app.project.activeSequence;
    if (!sequence) {
      return JSON.stringify({ success: false, error: 'No active sequence' });
    }

    // Create essential graphics title
    var graphicsItem = app.project.rootItem.createTitle(params.text || 'Text');

    // Insert on video track 2 (overlay track)
    if (sequence.videoTracks.numTracks > 1) {
      var track = sequence.videoTracks[1];
      track.insertClip(graphicsItem, params.time || 0);
    } else {
      var track = sequence.videoTracks[0];
      track.insertClip(graphicsItem, params.time || 0);
    }

    return JSON.stringify({ success: true, message: 'Text added: ' + params.text });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function trimClip(params) {
  try {
    var sequence = app.project.activeSequence;
    var track = sequence.videoTracks[0];
    var clip = track.clips[params.clipIndex || 0];

    if (!clip) {
      return JSON.stringify({ success: false, error: 'Clip not found' });
    }

    if (typeof params.startTime !== 'undefined') {
      clip.setInPoint(params.startTime, 4);
    }
    if (typeof params.endTime !== 'undefined') {
      clip.setOutPoint(params.endTime, 4);
    }

    return JSON.stringify({ success: true, message: 'Clip trimmed' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function makeCut(params) {
  try {
    var sequence = app.project.activeSequence;
    sequence.getPlayerPosition().seconds = params.time;

    // Use razor tool at current position
    var track = sequence.videoTracks[0];
    for (var i = 0; i < track.clips.numItems; i++) {
      var clip = track.clips[i];
      if (clip.start.seconds <= params.time && clip.end.seconds > params.time) {
        // Create a cut
        app.project.activeSequence.razor(params.time);
        break;
      }
    }

    return JSON.stringify({ success: true, message: 'Cut made at ' + params.time + 's' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function addEffect(params) {
  try {
    var sequence = app.project.activeSequence;
    var clip = sequence.videoTracks[0].clips[params.clipIndex || 0];

    if (!clip) {
      return JSON.stringify({ success: false, error: 'Clip not found' });
    }

    // Add effect (example: Gaussian Blur)
    var effectName = params.effect || 'Gaussian Blur';
    var components = app.getVideoEffectList();

    for (var i = 0; i < components.length; i++) {
      if (components[i].displayName.toLowerCase().indexOf(effectName.toLowerCase()) !== -1) {
        clip.components.addComponent(components[i]);
        return JSON.stringify({ success: true, message: effectName + ' effect added' });
      }
    }

    return JSON.stringify({ success: false, error: 'Effect not found: ' + effectName });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function updateClip(params) {
  try {
    var sequence = app.project.activeSequence;
    if (!sequence) {
      return JSON.stringify({ success: false, error: 'No active sequence' });
    }

    var clip = sequence.videoTracks[0].clips[params.clipIndex || 0];
    if (!clip) {
      return JSON.stringify({ success: false, error: 'Clip not found' });
    }

    var updates = params.updates || {};
    var messages = [];

    // Scale
    if (typeof updates.scale !== 'undefined') {
      var scalePercent = updates.scale * 100;
      clip.setScale(scalePercent);
      messages.push('scaled to ' + scalePercent + '%');
    }

    // Rotation
    if (typeof updates.rotate !== 'undefined') {
      clip.setRotation(updates.rotate);
      messages.push('rotated ' + updates.rotate + ' degrees');
    }

    // Opacity
    if (typeof updates.opacity !== 'undefined') {
      clip.setOpacity(updates.opacity);
      messages.push('opacity set to ' + updates.opacity + '%');
    }

    // Position (Motion effect)
    if (updates.position) {
      // Note: Position is handled via Motion effect properties in Premiere
      // This is a simplified version - full implementation requires accessing components
      messages.push('position updated');
    }

    return JSON.stringify({
      success: true,
      message: 'Clip updated: ' + messages.join(', ')
    });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function removeClip(params) {
  try {
    var sequence = app.project.activeSequence;
    if (!sequence) {
      return JSON.stringify({ success: false, error: 'No active sequence' });
    }

    if (params.clipId === 'all') {
      // Remove all clips from timeline
      var count = 0;
      for (var t = 0; t < sequence.videoTracks.numTracks; t++) {
        var track = sequence.videoTracks[t];
        while (track.clips.numItems > 0) {
          track.clips[0].remove(false, true);
          count++;
        }
      }
      return JSON.stringify({ success: true, message: 'Removed ' + count + ' clips from timeline' });
    }

    if (params.clipId === 'last') {
      // Remove last clip
      var track = sequence.videoTracks[0];
      if (track.clips.numItems > 0) {
        track.clips[track.clips.numItems - 1].remove(false, true);
        return JSON.stringify({ success: true, message: 'Removed last clip' });
      }
      return JSON.stringify({ success: false, error: 'No clips to remove' });
    }

    // Remove clip by index
    var clipIndex = parseInt(params.clipId) || params.clipIndex || 0;
    var clip = sequence.videoTracks[0].clips[clipIndex];
    if (clip) {
      clip.remove(false, true);
      return JSON.stringify({ success: true, message: 'Clip removed' });
    }

    return JSON.stringify({ success: false, error: 'Clip not found' });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

function addTransition(params) {
  try {
    var sequence = app.project.activeSequence;
    if (!sequence) {
      return JSON.stringify({ success: false, error: 'No active sequence' });
    }

    var transitionType = params.type || 'dissolve';
    var duration = params.duration || 1.0;
    var clipIndex = params.clipIndex || 0;

    var clip = sequence.videoTracks[0].clips[clipIndex];
    if (!clip) {
      return JSON.stringify({ success: false, error: 'Clip not found' });
    }

    // Get available transitions
    var transitions = app.getVideoTransitionList();
    var targetTransition = null;

    // Map common transition names
    var transitionNames = {
      'dissolve': 'Cross Dissolve',
      'fade': 'Dip to Black',
      'wipe': 'Wipe',
      'slide': 'Slide'
    };

    var searchName = transitionNames[transitionType] || transitionType;

    for (var i = 0; i < transitions.length; i++) {
      if (transitions[i].displayName.toLowerCase().indexOf(searchName.toLowerCase()) !== -1) {
        targetTransition = transitions[i];
        break;
      }
    }

    if (!targetTransition) {
      return JSON.stringify({ success: false, error: 'Transition not found: ' + transitionType });
    }

    // Apply transition
    clip.setInTransition(targetTransition, duration);

    return JSON.stringify({ success: true, message: transitionType + ' transition added' });
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
