// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let fontList = [];
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 275, height: 222 });
console.log("testing log");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const labelNodes = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "label");
        yield figma.loadFontAsync({ family: "Roboto", style: "Regular" });
        for (const node of figma.currentPage.selection) {
            if (node.type === 'TEXT') {
                console.log("loading font...");
                yield figma.loadFontAsync(node.fontName);
                console.log("selected font loaded");
                return "label-frames";
            }
        }
        for (let i = 0; i < labelNodes.length; i++) {
            if (labelNodes[i] != null) {
                console.log("loading font...");
                yield figma.loadFontAsync(labelNodes[i].fontName);
            }
        }
        if (figma.currentPage.selection.length === 0) {
            // figma.notify('Select a text layer before creating labels to match its style');
        }
    });
}
figma.on('selectionchange', () => {
    for (const node of figma.currentPage.selection) {
        if (node.type === 'TEXT') {
            console.log("loading font...");
            figma.loadFontAsync(node.fontName);
            console.log("selected font loaded");
            return "label-frames";
        }
    }
});
function updateExample(fontName, fontSize, decoration, fill) {
    figma.ui.postMessage({
        type: "updateExample",
        fontName: fontName
    });
}
function labelFrames(nodes, labelNodes, padding) {
    var theFontName = { family: "Roboto", style: "Regular" };
    var theFontSize = 48;
    var theTextDecoration;
    var theFontFill;
    var theError = "";
    if (figma.currentPage.selection.length > 0 && figma.currentPage.selection[0].type === "TEXT") {
        for (const node of figma.currentPage.selection) {
            figma.notify('matching style of selected frame...', { timeout: 1.5 });
            theFontSize = node.fontSize;
            theFontFill = node.fills;
            theTextDecoration = node.textDecoration;
            theFontName = node.fontName;
        }
    }
    else if (labelNodes[0] != null) {
        theFontName = labelNodes[0].fontName;
        theFontSize = labelNodes[0].fontSize;
        theTextDecoration = labelNodes[0].textDecoration;
        theFontFill = labelNodes[0].fills;
        figma.notify('updating frame labels...'), { timeout: 1.5 };
    }
    else {
        figma.notify('creating new frame labels...', { timeout: 1.5 });
    }
    for (let i = 0; i < labelNodes.length; i++) {
        if (labelNodes[i] != null) {
            labelNodes[i].remove();
        }
    }
    figma.currentPage.selection = [];
    console.log("creating labels...");
    for (let i = 0; i < nodes.length; i++) {
        const text = figma.createText();
        text.characters = nodes[i].name;
        text.setPluginData("label-artboards", "label");
        text.name = "🏷".concat(text.name);
        text.fontSize = theFontSize;
        if (theTextDecoration != null) {
            text.textDecoration = theTextDecoration;
        }
        if (theFontFill != null) {
            text.fills = theFontFill;
        }
        try {
            text.fontName = theFontName;
        }
        catch (error) {
            theError = "error setting font family... try again";
        }
        text.x = nodes[i].x;
        text.y = nodes[i].y - text.height - padding;
        figma.currentPage.selection = figma.currentPage.selection.concat(text);
    }
    if (theError != "") {
        figma.notify(theError);
        console.log(theError);
    }
    const labelGroup = figma.group(figma.currentPage.selection, figma.currentPage.children[0].parent);
    labelGroup.setPluginData("label-artboards", "group");
    labelGroup.name = "🏷";
}
main().then((message) => {
    const labelNodes = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "label");
    var isLocked = false;
    var isHidden = false;
    var existingLabels = true;
    if (labelNodes[0] != null) {
        existingLabels = true;
        if (labelNodes[0].parent.locked === false) {
            isLocked = false;
        }
        else {
            isLocked = true;
        }
        if (labelNodes[0].parent.visible === false) {
            isHidden = true;
        }
        else {
            isHidden = false;
        }
        // if (labelNodes[0].visible === false) {
        //   isHidden = true;
        // } else {
        //   isHidden = false;
        // }
    }
    else {
        existingLabels = false;
    }
    figma.ui.postMessage({
        type: "launch",
        isLocked: isLocked,
        isHidden: isHidden,
        existingLabels: existingLabels
    });
    // Calls to "parent.postMessage" from within the HTML page will trigger this
    // callback. The callback will be passed the "pluginMessage" property of the
    // posted message.
    figma.ui.onmessage = msg => {
        const nodes = figma.currentPage.findAll(node => node.type === "FRAME" && node.parent === figma.currentPage.children[0].parent);
        const compNodes = figma.currentPage.findAll(node => node.type === "COMPONENT" && node.parent === figma.currentPage.children[0].parent);
        const instaNodes = figma.currentPage.findAll(node => node.type === "INSTANCE" && node.parent === figma.currentPage.children[0].parent);
        const labelNodes = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "label");
        if (nodes.length === 0) {
            figma.notify('create a frame to label!'), { timeout: 0.5 };
            return "error: no frames";
        }
        // One way of distinguishing between different types of messages sent from
        // your HTML page is to use an object with a "type" property like this.
        if (msg.type === 'label-frames') {
            labelFrames(nodes, labelNodes, msg.padding);
            figma.ui.postMessage({
                type: "labeled"
            });
        }
        if (msg.type === 'label-frames-and-comps') {
            labelFrames(nodes.concat(compNodes.concat(instaNodes)), labelNodes, msg.padding);
            figma.ui.postMessage({
                type: "labeled"
            });
        }
        if (msg.type === 'lock') {
            var isLocked = false;
            const labelGroup = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "group");
            for (let i = 0; i < labelGroup.length; i++) {
                if (labelGroup[i] != null) {
                    if (labelGroup[i].locked === false) {
                        labelGroup[i].locked = true;
                        isLocked = true;
                    }
                    else {
                        labelGroup[i].locked = false;
                        isLocked = false;
                    }
                }
            }
            figma.ui.postMessage({
                type: "updateLock",
                isLocked: isLocked
            });
        }
        if (msg.type === 'hide') {
            var isHidden = false;
            const labelGroup = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "group");
            for (let i = 0; i < labelGroup.length; i++) {
                if (labelGroup[i] != null) {
                    if (labelGroup[i].visible === false) {
                        labelGroup[i].visible = true;
                        isHidden = false;
                    }
                    else {
                        labelGroup[i].visible = false;
                        isHidden = true;
                    }
                }
            }
            figma.ui.postMessage({
                type: "updateEye",
                isHidden: isHidden
            });
        }
        if (msg.type === 'delete') {
            var deletedSomething = false;
            const labelGroup = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "group");
            if (labelGroup.length != 0) {
                for (let i = 0; i < labelGroup.length; i++) {
                    if (labelGroup[i] != null) {
                        labelGroup[i].remove();
                        deletedSomething = true;
                    }
                }
            }
            else {
                //nothing to delete
            }
            figma.ui.postMessage({
                type: "delete",
                deletedSomething
            });
        }
        if (msg.type === 'cancel') {
            figma.closePlugin(message);
        }
        // Make sure to close the plugin when you're done. Otherwise the plugin will
        // keep running, which shows the cancel button at the bottom of the screen.
        // figma.closePlugin();
    };
});
