// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

let fontList = [];

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {width: 275, height: 225});

console.log("testing log");

async function main(): Promise <string | undefined> {
  const labelNodes = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "label")

  await figma.loadFontAsync({family: "Roboto", style: "Regular"});

  for (const node of figma.currentPage.selection) {
    if (node.type === 'TEXT') {
      console.log("loading font...");
      await figma.loadFontAsync(node.fontName);
      console.log("selected font loaded");
      return "label-frames";
    } 
  }

  for (let i = 0; i < labelNodes.length; i++) {
    if (labelNodes[i] != null) {
      console.log("loading font...");
      await figma.loadFontAsync(labelNodes[i].fontName);
    }
  }

  if (figma.currentPage.selection.length === 0) {
    // figma.notify('Select a text layer before creating labels to match its style');
  }
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
})

main().then((message: string | undefined) => {
  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    const nodes = figma.currentPage.findAll(node => node.type === "FRAME" && node.parent === figma.currentPage.children[0].parent);
    const labelNodes = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "label");

    if (nodes.length === 0) {
      figma.notify('create a frame to label!'), {timeout: 0.5};
      return "error: no frames"
    }

    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'label-frames') {
      var theFontName: FontName = { family: "Roboto", style: "Regular" };
      var theFontSize: number = 48;
      var theTextDecoration: TextDecoration;
      var theFontFill: Paint;
      var theError: string = "";

      if (figma.currentPage.selection.length > 0 && figma.currentPage.selection[0].type === "TEXT") {
        for (const node of figma.currentPage.selection) {
            figma.notify('matching style of selected frame...', {timeout: 2});
            theFontSize = node.fontSize;
            theFontFill = node.fills;
            theTextDecoration = node.textDecoration;
            theFontName = node.fontName;
        }
      } else if (labelNodes[0] != null) {
          theFontName = labelNodes[0].fontName;
          theFontSize = labelNodes[0].fontSize;
          theTextDecoration = labelNodes[0].textDecoration;
          theFontFill = labelNodes[0].fills;

          figma.notify('updating frame labels...'), {timeout: 2};
      } else {
        figma.notify('creating new frame labels...', {timeout: 2});
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
        if (theTextDecoration != null) {text.textDecoration = theTextDecoration;}
        if (theFontFill != null)       {text.fills = theFontFill}

        try {
          text.fontName = theFontName
        } catch (error) {
          theError = "error setting font family... try again";
        }

        text.x = nodes[i].x;
        text.y = nodes[i].y - text.height - msg.padding;
        
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

    if (msg.type === 'lock') {
      const labelGroup = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "group")
      for (let i = 0; i < labelGroup.length; i++) {
        if (labelGroup[i] != null) {
          if (labelGroup[i].locked === false) {
            labelGroup[i].locked = true;
          } else {
            labelGroup[i].locked = false;
          }
          
        }
      }
    }
      
    if (msg.type === 'hide') {
      const labelGroup = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "group")
      for (let i = 0; i < labelGroup.length; i++) {
        if (labelGroup[i] != null) {
          if (labelGroup[i].visible === false) {
            labelGroup[i].visible = true;
          } else {
            labelGroup[i].visible = false;
          }
        }
      }
    }

    if (msg.type === 'delete') {
      const labelGroup = figma.currentPage.findAll(node => node.getPluginData("label-artboards") === "group")
      for (let i = 0; i < labelGroup.length; i++) {
        if (labelGroup[i] != null) {
          labelGroup[i].remove();
        }
      }
    }

    if (msg.type === 'cancel') {
      figma.closePlugin(message)
    }
    
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    // figma.closePlugin();
  }
})