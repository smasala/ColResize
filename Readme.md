# ColResize

**Doesn't always work under jQuery version `3.2.x`: [https://github.com/jquery/jquery/issues/3611]()**
use 3.1.1 if you can until 3.3.x is available :)

ColResize adds the ability for the end user to click and drag column headers to resize a DataTables table.

# Demo
[https://smasala.github.io/ColResize/](https://smasala.github.io/ColResize/)

# Compatibility

Tested in:
 - Chrome 59.0.3071.115
 - FF 54.0.1
 - IE 8, 9 (without scrollY + fixed header feature)
 - IE 10+ (for scrollY + fixed header feature)

# Installation

## NPM and Bower

If you prefer to use a package manager such as NPM or Bower, distribution repositories are available with software built from this repository under the name `dt-colresize`. Styling packages for Bootstrap, Foundation and other styling libraries are also available by adding a suffix to the package name.

Please see the DataTables [NPM](//datatables.net/download/npm) and [Bower](//datatables.net/download/bower) installation pages for further information. The [DataTables installation manual](//datatables.net/manual/installation) also has details on how to use package managers with DataTables.


# Basic usage

Import necessary files:
```
<!DOCTYPE html> <!-- must be set for scrollY + fixed header feature -->
...
<script type="text/javascript" src="../js/dataTables.colResize.js"></script>
<link rel="stylesheet" href="../css/dataTables.colResize.css" />
```

ColResize is initialised using the `colResize` option in the DataTables constructor - a simple boolean `true` will enable the feature. Further options can be specified using this option as an object - see the documentation for details.
`autoWidth` and `scrollX` must also be set as `false`.

Example:

```js
$(document).ready( function () {
    $('#myTable').DataTable( {
    	colResize: true,
        autoWidth: false,
        scrollX: false
    } );
} );
```

```css
/** Customise the resize bar **/
.dt-colresizable-col {
    /** styles go here **/
}
```

# Configuration / options

```js
$(document).ready( function () {
    $('#myTable').DataTable( {
    	colResize: {
            scrollY: 200,       //cannot be used with DT scrollY
            minColumnWidth: 50
        },
        autoWidth: false,
        scrollX: false
    } );
} );

```

Possible Options:
- `minColumnWidth`: number [default=10] must be equal too or greater than the sum of the cell's padding (left + right)
- `scrollY`: number [default=false] much like the DT [scrollY](https://datatables.net/reference/option/scrollY). Sets a fixed header and `tbody` height with scroll functionality. Cannot be used with DT `scrollY` option.
- `resizeTable`: boolean [default=false] set to true if you want the entire table to be shifted when a column is resized. Default behaviour is that when a column is resized the neighbouring column expands/shrinks accordingly. If set to `true`, when a column is resized, the neighbouring column is left untouched and the table shifts accordingly.

# API

This extension also has a few extra api functions which can be called by using the created DataTables instance.
```js
var dtInstance = $(table).DataTable({... colResize: true ...});
dtInstance.colResize.redraw();
```

Available functions:
- `redraw()`: forces a complete redraw of the draggable bars etc by destroying the current DOM elements and recreating them
- `visible(columnIndex, visibilityBoolean, redrawCalculationsBoolean)`: when using the ColResize extension, the standard column visibility function should be avoided because the events are too late for ColResize to use. Use this visible function instead. [Original docs for more info](https://datatables.net/reference/api/column().visible()).


# events

Events can be caught on the DataTable instance object

```js
var dtInstance = $(table).DataTable({... colResize: true ...});
dtInstance.on("column-resized.dt" function(event, columnIndex, newColumnWidth) {
    // do something  
});
```

Possible events:
- `column-resized.dt` arguments: (jQuery Event Object, columnIndex [integer], newColumnWidth [integer]) - fired after a drag event on mouse up.

# Documentation / support

* [DataTables support forums](http://datatables.net/forums)