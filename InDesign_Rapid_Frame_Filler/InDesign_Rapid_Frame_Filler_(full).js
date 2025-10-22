app.doScript(function () {

    // Get active document
    var doc = app.activeDocument;

    // Get active spread
    var spread = doc.layoutWindows[0].activeSpread;

    // Get spread pages
    var pages = spread.pages;

    // Get document bleed
    var bleedTop = doc.documentPreferences.documentBleedTopOffset;
    var bleedBottom = doc.documentPreferences.documentBleedBottomOffset;
    var bleedInside = doc.documentPreferences.documentBleedInsideOrLeftOffset;
    var bleedOutside = doc.documentPreferences.documentBleedOutsideOrRightOffset;

    // Get total width and height + bleed for the spread
    function getTotalSpreadDimensions(pages) {
        var leftPage = pages[0];
        var rightPage = pages[pages.length - 1];
        var pageWidth = rightPage.bounds[3] - leftPage.bounds[1];
        var pageHeight = leftPage.bounds[2] - leftPage.bounds[0];
        var totalWidth = pageWidth + bleedInside + bleedOutside;
        var totalHeight = pageHeight + bleedTop + bleedBottom;
        return { width: totalWidth, height: totalHeight, pageWidth: pageWidth, pageHeight: pageHeight };
    }

    // Get selected object
    var selectedObject = app.selection && app.selection.length ? app.selection[0] : null;

    // Helper: resolve to a frame if a Graphic itself is selected
    function getTargetFrame(sel) {
        if (!sel) return null;
        // If the user selected a placed graphic (Image/PDF/EPS/ImportedPage), use its parent frame
        if (sel instanceof Graphic && sel.parent && (sel.parent instanceof Rectangle || sel.parent instanceof Polygon || sel.parent instanceof Oval)) {
            return sel.parent;
        }
        // If the user selected a frame directly
        if (sel instanceof Rectangle || sel instanceof Polygon || sel instanceof Oval || sel instanceof TextFrame) {
            return sel;
        }
        return null;
    }

    var frame = getTargetFrame(selectedObject);

    if (frame) {
        var dimensions = getTotalSpreadDimensions(pages);

        // Calculate geometric bounds for the selected object to fill spread and the bleed
        var bounds = [
            -bleedTop,
            -bleedInside,
            dimensions.pageHeight + bleedBottom,
            dimensions.pageWidth + bleedOutside
        ];

        // Transform frame to fill the spread and the bleed
        frame.geometricBounds = bounds;

        // If the frame contains any placed graphic (image/pdf/eps/ai/etc), fit content proportionally + center
        if (frame.allGraphics && frame.allGraphics.length > 0) {
            // Make sure we don't distort placed content
            frame.fit(FitOptions.FILL_PROPORTIONALLY); // fills frame while preserving aspect ratio
            frame.fit(FitOptions.CENTER_CONTENT);      // center after fill to avoid off-center crop
        }

    } else {
        alert("Selecteer een frame of een geplaatst object (image/pdf/eps/ai) dat gefit moet worden.");
    }

    // from: https://github.com/frietjewaterfiets

}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Rapid Frame Filler (full)");
