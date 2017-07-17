/**! ColResize 1.0.2
 * ©2017 Steven Masala
 */

/**
 * @summary ColResize
 * @description Provide the ability to resize the columns in a DataTable
 * @version 1.0.2
 * @file dataTables.colResize.js
 * @author Steven Masala <me@smasala.com>
 * @copyright Copyright 2017 Steven Masala
 * 
 * This source file is free software, available under the following license:
 *   MIT license - https://github.com/smasala/ColResize/blob/master/LICENSE
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */
(function( factory ) {
    if ( typeof define === "function" && define.amd ) {
        // amd
        define( ["jquery", "datatables.net"], function($) {
            return factory($, window, document);
        });
    } else if (typeof exports === "object") {
        // CommonJs
        module.exports = function( root, $ ) {
            if ( !root ) {
                root = window;
            }
            if ( !$ || !$.fn.dataTable ) {
                $ = require( "datatables.net" )( root, $ ).$;
            }
            return factory( $, root, root.document );
        };
    } else {
        factory(jQuery, window, document);
    }
} (function( $, window, document ) {
    "use strict";
    var DataTable = $.fn.dataTable;

    // Sanity check that we are using DataTables 1.10 or newer
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.15' ) ) {
		throw 'DataTables ColResize requires DataTables 1.10.15 or newer';
	}

    var ColResize = function( dt, userOptions) {
        var dtInstance = new DataTable.Api( dt ),
            settings = dtInstance.settings()[0];

        if (settings.colresize) {
            // already exists on this instance
            return;
        }
        this.options = $.extend(true, {}, this._defaults, userOptions);
        this.init(dtInstance);
        settings.colresize = this;
    };

    $.extend( ColResize.prototype, {
        /**
         * Extension version number
         * @static
         * @property version
         * @type {string} semVer
         */
        version: "1.0.2",
        /**
         * Default options for extension
         * @property _defaults
         * @type {object}
         * @private
         */
        _defaults: {
            /**
             * Determines the minimum width size a column is allowed to be
             * @property minColumnWidth
             * @public
             * @type {integer}
             * @default 20
             */
            minColumnWidth: 20
        },
        /**
         * Created during extension init
         * {} <= defaults <= userOptions
         * @property options
         * @type {object}
         * @public
         * @default {null}
         */
        options: null,
        /**
         * Current jquery table element
         * @property _table
         * @type {jQuery}
         * @private
         * @default {null}
         */
        _table: null,
        /**
         * Datatables instance
         * @property _dtInstance
         * @type {DataTables.Api}
         * @private
         * @default {null}
         */
        _dtInstance: null,
        /**
        * Is column currently being dragged?
        * internal flag
        * @property _isDragging
        * @type {boolean}
        * @private
        * @default {false}
        */
        _isDragging: false,
        /**
         * Element cache variable.
         * @property _container
         * @type {jQuery}
         * @private
         * @default null
         */
        _container: null,
        /**
         * Array of all generated draggable columns.
         * @property _columns
         * @type {jQuery[]}
         * @private
         * @default null
         */
        _columns: null,
        /**
         * Interval value used to check if the table height has changed.
         * @property _tableHeight
         * @type {integer}
         * @private
         * @default 0
         */
        _tableHeight: 0,
        /**
         * css class for draggable container
         * @private
         * @property CLASS_WRAPPER
         * @type {string}
         * @private
         * @default "dt-colresizable"
         */
        CLASS_WRAPPER: "dt-colresizable",
        /**
         * css class for draggable column
         * @private
         * @property CLASS_COLUMN
         * @type {string}
         * @private
         * @default "dt-colresizable-col"
         */
        CLASS_COLUMN: "dt-colresizable-col",
        /**
         * data tag name to save the column width <th>
         * saved on the draggable col <div>
         * @private
         * @property DATA_TAG_WIDTH
         * @type {string}
         * @private
         * @default "dt-colresizable-width"
         */
        DATA_TAG_WIDTH: "dt-colresizable-width",
        /**
         * data tag name to save the column item <th>
         * saved on the draggable col <div>
         * @private
         * @property DATA_TAG_ITEM
         * @type {string}
         * @private
         * @default "dt-colresizable-item"
         */
        DATA_TAG_ITEM: "dt-colresizable-item",
        /**
         * @method init
         * @param {object} dtInstance
         */
        init: function(dtInstance) {
            var that = this;
            that._dtInstance = dtInstance;
            that._table = $(that._dtInstance.table().node());
            that.buildDom();
        },
        /**
         * Builds the draggable components together and places
         * them in the DOM (above the actual table)
         * @method buildDom
         * @returns null
         */
        buildDom: function() {
            var that = this;
            that._container = $("<div class='" + that.CLASS_WRAPPER + "'></div>");
            that._container.css({
                width: that._table.outerWidth()
            });
            // build and insert columns into container
            that._container.append(that.buildColDoms());
            // cache jQuery columns
            that._columns = $("." + that.CLASS_COLUMN, that._container);
            that._table.before(that._container);
            // add window resize events etc?
        },
        /**
         * Creates the draggable columns, add the necessary drag events 
         * @method buildColDoms
         * @return jQuery[] actual draggable columns as jquery objects
         */
        buildColDoms: function() {
            // replicate table header widths
            var that = this,
                $ths = that._table.find("thead th"),    // get all table headers
                $th,
                $cols = [],
                $col,
                thWidth = 0;
            that._tableHeight = that._table.outerHeight();    // get table height
            for (var i = 0, l = $ths.length; i < l; i++) {
                $th = $($ths[i]);   // get individual <th>
                thWidth = $th.outerWidth(); // get <th> current width
                $col = $("<div class='" + that.CLASS_COLUMN + "'></div>"); // create drag column item <div>
                // place the drag column at the end of the <th> and as tall as the table itself
                $col.css({
                    left: $th.position().left + thWidth,
                    height: that._tableHeight
                });
                // save the current width
                $col.data(that.DATA_TAG_WIDTH, thWidth);
                // save the <th> element reference for easy access later
                $col.data(that.DATA_TAG_ITEM, $th);
                // set the width on the <th> if it wasn't set inline already <th style="width: {N}px;"></th>
                $th.css("width", thWidth);
                // register necessary events
                that.registerEvents($col);
                // push created drag column element in array
                $cols.push($col);
            }
            return $cols;
        },
        /**
         * Registers the required drag events on the specified column.
         * @method registerEvents
         * @param $col {jQuery}
         * @returns {null}
         */
        registerEvents: function($col) {
            var that = this;
            $col.mousedown(that.onMouseDown());
        },
        /**
         * Returns the mousedown event function to be used by jQuery.mousedown()
         * @method onMouseDown
         * @returns {function}
         */
        onMouseDown: function() {
            var that = this;
            return function() {
                var $col = $(this),
                    mouseMoveFunc = function(event) {
                        that.onMouseMove(event, $col);
                    };
                that._isDragging = true;
                // check if the use has "let go of dragging"
                // mouse up 
                $(document).one("mouseup", function() {
                    // no longer dragging the column
                    that._isDragging = false;
                    // remove the drag (mousemove) event listener
                    $(document).off("mousemove", mouseMoveFunc);
                }).on("mousemove", mouseMoveFunc);  //on mousemove
                return false;   // stop text highlighting
            };
        },
        /**
         * Used by jQuery.mousemove to determine the new column widths when a drag action is undertaken
         * @method onMouseMove
         * @param {MouseEvent} event
         * @param {jQuery} $col
         * @returns {null}
         */
        onMouseMove: function(event, $col) {
            var that = this,
                diff = 0;
            if (that._isDragging) {
                // caculate the different between where the mouse has moved to
                // and the left position of the column that is being dragged
                diff = (event.clientX - $col.offset().left);
                // check whether neighbouring is still bigger than 10px if a resize
                // takes place.
                if (($col.position().left + diff) < ($col.next().position().left - that.options.minColumnWidth)) {
                    if (that.updateColumn($col, diff)) {
                        // col was resized so resize the neighbouring col too.
                        that.updateColumn($col.next(), diff < 0 ? Math.abs(diff) : -Math.abs(diff), true);
                    }
                }
                that.checkTableHeight()
            }
        },
        /**
         * Update the column width by a given number
         * @method updateColumn
         * @param {jQuery} $col - column that needs a size adjustment
         * @param {integer} by - width to change the column size by
         * @param {boolean} nextColumn [default=false] - set to true if the column being resized is not the original but
         * it's sibling.
         * @return {boolean} {true} if resize was possible, {false} if not;
         */
        updateColumn: function($col, by, nextColumn) {
            var that = this,
                // calculate the new width of the column
                newWidth = by + $col.data(that.DATA_TAG_WIDTH);
            //only resize to a min of 10px
            if (newWidth > that.options.minColumnWidth) {
                if(!nextColumn) {
                    // set the new let position of the dragged column (div)
                    $col.css({
                        left: by + $col.position().left
                    });
                }
                // get the actual <th> column of the table and set the new width
                $col.data(that.DATA_TAG_ITEM).css({
                    width: newWidth
                });
                // save the new width for the next mouse drag call
                $col.data(that.DATA_TAG_WIDTH, newWidth);
                return true;
            }
            return false;
        },
        /**
         * Checks whether the height of the table has changed, 
         * if it has, then it set the draggable column items with 
         * the new height values.
         * @method checkTableHeight
         * @returns null
         */
        checkTableHeight: function() {
            var that = this,
                newHeight = that._table.outerHeight();
            if (newHeight !== that._tableHeight) {
                that._tableHeight = that._table.outerHeight();
                that._columns.css("height", newHeight);
            }

        }
    });

    $.fn.dataTable.ColResize = ColResize;
    $.fn.DataTable.ColResize = ColResize;

    $(document).on("init.dt.dtr", function(e, settings) {
        if(e.namespace !== "dt") {
            return;
        }
        var init = settings.oInit.colResize,
            defaults = DataTable.defaults.colResize;
        if(init !== false) {
            var opts = $.extend({}, init, defaults);
            new ColResize(settings, opts);
        }
    });
    return ColResize;
}));