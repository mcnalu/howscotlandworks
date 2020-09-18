For scripts in this folder to work you need to set $HSW_ROOT to where the relevant files in this git repository are located on your system eg

```bash
export HSW_ROOT=/home/andrew/dev/howscotlandworks
```

Also you need to have node.js installed for the node2svg.js to work its magic and install two dependencies:
```bash
npm install d3 jsdom
```

The scripts take CSV files that I have prepared then I use the javascript code to turn these into SVG files (scalable vector graphics) which are then turned into PNG image files. The final step is performed by the *convert* command from ImageMagick.


