/**
 * Copy the filename of the selected image to the clipboard
 * Silent (no alerts) + restore tool afterward
 */
(function () {
    var tf = null, savedSel = null, prevRedraw, prevTool = null;
    try {
        if (app.documents.length === 0) return;
        if (!app.selection || app.selection.length === 0) return;

// Save current tool (if available)
        try { prevTool = app.toolBoxTools.currentTool; } catch (_) {}

        prevRedraw = app.scriptPreferences.enableRedraw;
        app.scriptPreferences.enableRedraw = false;

        var doc = app.activeDocument;
        var target = app.selection[0];
        var graphic = null;

        if (target && target.constructor && target.constructor.name === "Image") {
            graphic = target;
        } else if (target && target.allGraphics && target.allGraphics.length > 0) {
            graphic = target.allGraphics[0];
        } else if (target && target.graphics && target.graphics.length > 0) {
            graphic = target.graphics[0];
        }
        if (!graphic || !graphic.itemLink) return;

        var filename = graphic.itemLink.name;
        if (!filename) return;

        // Copy via a temporary text frame on the pasteboard
        savedSel = app.selection;
        app.select(null);

        tf = doc.textFrames.add();
        tf.geometricBounds = [-2000, -2000, -1990, -1000];
        tf.contents = filename;

        // Select the contents (yes, this triggers the Type Tool) and copy
        tf.texts[0].select();
        app.copy();

    } catch (e) {
        // Fail silently
    } finally {
        // Clean up & restore selection
        if (tf && tf.isValid) { try { tf.remove(); } catch (_) {} }
        if (savedSel) { try { app.select(savedSel); } catch (_) {} }
        if (prevRedraw !== undefined) { try { app.scriptPreferences.enableRedraw = prevRedraw; } catch (_) {} }

// ---- Restore tool ----
		// 1) If able to read the previous tool, switch back to it
        try { if (prevTool !== null) app.toolBoxTools.currentTool = prevTool; } catch (_) {}

        // 2) Fallback: force Selection Tool via menuAction (language-independent via $ID)
        try { app.menuActions.item("$ID/Selection Tool").invoke(); } catch (_) {}
    }
})();

// from: https://github.com/frietjewaterfiets