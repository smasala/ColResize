# ColResize

**Not an official extension!**

ColResize adds the ability for the end user to click and drag column headers to resize a table as they see fit, to DataTables.

# Installation

## NPM and Bower

If you prefer to use a package manager such as NPM or Bower, distribution repositories are available with software built from this repository under the name `dt-colresize`. Styling packages for Bootstrap, Foundation and other styling libraries are also available by adding a suffix to the package name.

Please see the DataTables [NPM](//datatables.net/download/npm) and [Bower](//datatables.net/download/bower) installation pages for further information. The [DataTables installation manual](//datatables.net/manual/installation) also has details on how to use package managers with DataTables.


# Basic usage

Import necessary files:
```
<script type="text/javascript" src="../js/dataTables.colResize.js"></script>
<link rel="stylesheet" href="../css/dataTables.colResize.css" />
```

ColResize is initialised using the `colResize` option in the DataTables constructor - a simple boolean `true` will enable the feature. Further options can be specified using this option as an object - see the documentation for details.
`autoWidth` must also be set as `false`.

Example:

```js
$(document).ready( function () {
    $('#myTable').DataTable( {
    	colResize: true,
        autoWidth: false
    } );
} );
```

```css
/** Customise the resize bar **/
.dt-colresizable-col {
    /** styles go here **/
}
```


# Documentation / support

* [Documentation](https://datatables.net/extensions/colreorder/)
* [DataTables support forums](http://datatables.net/forums)