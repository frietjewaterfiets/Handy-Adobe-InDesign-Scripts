// InDesign Rapid Frame Filler (margin) — universal graphics fit within margins
// Works for PDF/AI/EPS/JPG/PNG/TIFF — also for grouped and inline/anchored graphics

app.doScript(function () {

    // --- Document & spread ---
    var doc = app.activeDocument;
    var spread = doc.layoutWindows[0].activeSpread;
    var pages = spread.pages;

    // --- Margin helpers ---
    function getPageMargins(page) {
        // In spreads: left = inside (op linkerpagina), right = outside (op rechterpagina)
        return {
            top: page.marginPreferences.top,
            bottom: page.marginPreferences.bottom,
            inside: page.marginPreferences.left,
            outside: page.marginPreferences.right
        };
    }

    function getSpreadWithinMargins(pages) {
        var leftPage = pages[0];
        var rightPage = pages[pages.length - 1];

        // Spread-outer edges
        var pageWidth  = rightPage.bounds[3] - leftPage.bounds[1];
        var pageHeight = leftPage.bounds[2] - leftPage.bounds[0];

        // Marges per zijde; bij enkelzijdige spread gebruik leftPage voor beide
        var lm = getPageMargins(leftPage);
        var rm = (pages.length > 1) ? getPageMargins(rightPage) : getPageMargins(leftPage);

        // Binnenruimte: inside/outside horizontaal; hoogste top/bottom verticaal
        var topMax = Math.max(lm.top, rm.top);
        var bottomMax = Math.max(lm.bottom, rm.bottom);

        return {
            pageWidth: pageWidth,
            pageHeight: pageHeight,
            top: topMax,
            left: lm.inside,
            bottom: pageHeight - bottomMax,
            right: pageWidth - rm.outside
        };
    }

    // --- Selection → target frames ---
    function collectTargetFrames() {
        var targets = [];

        function pushFrame(f) {
            if (!f) return;
            if (f instanceof Rectangle || f instanceof Polygon || f instanceof Oval) {
                targets.push(f);
            }
        }

        function fromGraphic(g) {
            // Klim omhoog tot we bij een echt grafisch frame zitten
            var p = g && g.parent;
            while (p && !(p instanceof Rectangle || p instanceof Polygon || p instanceof Oval)) {
                p = p.parent;
            }
            pushFrame(p);
        }

        if (!app.selection || app.selection.length === 0) return targets;

        for (var i = 0; i < app.selection.length; i++) {
            var sel = app.selection[i];

            if (sel instanceof Graphic) {
                fromGraphic(sel);
            } else if (sel instanceof Rectangle || sel instanceof Polygon || sel instanceof Oval) {
                pushFrame(sel);
            } else if (sel instanceof Group) {
                var g = sel.allGraphics;
                for (var gi = 0; gi < g.length; gi++) fromGraphic(g[gi]);
            } else if (sel.hasOwnProperty("allGraphics")) {
                // bv. TextFrame met inline/anchored graphics
                var ag = sel.allGraphics;
                for (var j = 0; j < ag.length; j++) fromGraphic(ag[j]);
            }
        }

        // Uniek maken
        var seen = {};
        var unique = [];
        for (var k = 0; k < targets.length; k++) {
            var id = targets[k].id;
            if (!seen[id]) { seen[id] = true; unique.push(targets[k]); }
        }
        return unique;
    }

    // --- Fit helpers ---
    function fitFrameToMargins(frame, dims) {
        // Bounds binnen marges van de spread
        frame.geometricBounds = [dims.top, dims.left, dims.bottom, dims.right];

        // Content laten meeschalen bij latere frame-resizes
        try { frame.fittingOptions.autoFit = true; } catch(_) {}

        // Standaard fit op het frame
        try {
            frame.fit(FitOptions.FILL_PROPORTIONALLY); // vullend, kan croppen
            frame.fit(FitOptions.CENTER_CONTENT);
        } catch(e) {}

        // Extra: fit ook het directe grafische kader (helpt bij sommige EPS/AI gevallen)
        var ag = frame.allGraphics;
        if (ag && ag.length > 0) {
            for (var i = 0; i < ag.length; i++) {
                var g = ag[i];
                var gfxFrame = g && g.parent;
                if (gfxFrame && (gfxFrame instanceof Rectangle || gfxFrame instanceof Polygon || gfxFrame instanceof Oval)) {
                    try {
                        gfxFrame.fit(FitOptions.FILL_PROPORTIONALLY);
                        gfxFrame.fit(FitOptions.CENTER_CONTENT);
                    } catch(e2) {}
                }
            }
        }
    }

    // --- Main ---
    var dims = getSpreadWithinMargins(pages);
    var frames = collectTargetFrames();

    if (frames.length === 0) {
        alert("Selecteer een frame, graphic, groep of tekstframe met inline graphic(s) om binnen de marges te vullen.");
    } else {
        for (var i = 0; i < frames.length; i++) fitFrameToMargins(frames[i], dims);
    }

}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Rapid Frame Filler (margin)");

// from: https://github.com/frietjewaterfiets
