/**! ColResize 2.2.2
 * ©2017 Steven Masala
 */

/**
 * @summary ColResize
 * @description Provide the ability to resize the columns in a DataTable
 * @version 2.2.2
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

        if (settings.colResize) {
            // already exists on this instance
            return;
        }
        this.options = $.extend(true, {}, this._defaults, userOptions);
        this.init(dtInstance);
        settings.colResize = this;
    };

    $.extend( ColResize.prototype, {
        /**
         * Extension version number
         * @static
         * @property version
         * @type {string} semVer
         */
        version: "2.2.2",
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
            minColumnWidth: 20,
            /**
             * Height of the table body
             * @property scrollY
             * @public
             * @type {integer|string|false}
             * @default false
             */
            scrollY: false
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
         * Wrapper which is created around the <table>
         * @property _wrapper
         * @private
         * @type {jQuery}
         * @default null 
         */
        _wrapper: null,
        /**
         * Current jquery table element
         * @property _table
         * @type {jQuery}
         * @private
         * @default {null}
         */
        _table: null,
        /**
         * Current jquery table body element
         * @property _tableBody
         * @type {jQuery}
         * @private
         * @default {null}
         */
        _tableBody: null,
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
         * Scroller Wrapper div used to show y scroll bar
         * @property _scrollWrapper
         * @type {jQuery}
         * @private
         * @default null
         */
        _scrollWrapper: null,
        /**
         * Mimics the tbody height
         * @property _scrollContent
         * @type {jQuery}
         * @private
         * @default null
         */
        _scrollContent: null,
        /**
         * Array of all generated draggable columns.
         * @property _columns
         * @type {jQuery[]}
         * @private
         * @default null
         */
        _columns: null,
        /**
         * Array of index numbers of the columns which have been updated
         * this is an internal cache which is used to only update the widths
         * of the <td> element in columns that were changed by the user,
         * for example on page change.
         * @property _updatedColumns
         * @type {interger[]}
         * @private
         * @default []
         */
        _updatedColumns: [],
        /**
         * Interval value used to check if the table height has changed.
         * @property _tableHeight
         * @type {integer}
         * @private
         * @default 0
         */
        _tableHeight: 0,
        /**
         * css class for container which the table is wrapped in.
         * @private
         * @property CLASS_TABLE_WRAPPER
         * @type {string}
         * @private
         * @default "dt-colresizable-table-wrapper"
         */
        CLASS_TABLE_WRAPPER: "dt-colresizable-table-wrapper",
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
         * css class for css conditional scroller identifier
         * @private
         * @property CLASS_SCROLLER_HASWRAPPER
         * @type {string}
         * @private
         * @default "dt-colresizable-with-scroller"
         */
        CLASS_SCROLLER_HASWRAPPER: "dt-colresizable-with-scroller",
        /**
         * css class for scroller wrapper div
         * @private
         * @property CLASS_SCROLLER_WRAPPER
         * @type {string}
         * @private
         * @default "dt-colresizable-scroller-wrapper"
         */
        CLASS_SCROLLER_WRAPPER: "dt-colresizable-scroller-wrapper",
        /**
         * css class for scroller content mimic div
         * @private
         * @property CLASS_SCROLLER_CONTENT_WRAPPER
         * @type {string}
         * @private
         * @default "dt-colresizable-scroller-content-wrapper"
         */
        CLASS_SCROLLER_CONTENT_WRAPPER: "dt-colresizable-scroller-content-wrapper",
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
         * data tag name to save the previous draggable column
         * element
         * @private
         * @property DATA_TAG_PREV_COL
         * @type {string}
         * @private
         * @default "dt-prev-col-item"
         */
        DATA_TAG_PREV_COL: "dt-prev-col-item",
        /**
         * @method init
         * @param {object} dtInstance
         */
        init: function(dtInstance) {
            var that = this;
            that._dtInstance = dtInstance;
            that._table = $(that._dtInstance.table().node());
            that._tableBody = that._table.find("tbody");
            that.buildDom();
        },
        /**
         * Builds the draggable components together and places
         * them in the DOM (above the actual table)
         * @method buildDom
         * @returns null
         */
        buildDom: function() {
            var that = this,
                redraw = !!(that._wrapper);
            // wrap the table so that the overflow can be controlled when
            // resizing a big table on a small screen
            if (!redraw) {
                // wrapper check is needed for "redraw()", since this is left over and
                // the table shouldn't be "re-wrapped"
                that._table.wrap("<div class='" + that.CLASS_TABLE_WRAPPER + "'></div>");
                that._wrapper = that._table.parent();
            } 

            // build the column resize container and draggable bars
            that._container = $("<div class='" + that.CLASS_WRAPPER + "'></div>");

            if (!redraw && that.options.scrollY) {
                that.initScroller();
            }

            that._table.css("width", that._table.width() - (!redraw ? 5 : 0));
            that._container.width(that._table.width());

            // build and insert columns into container
            that._container.append(that.buildColDoms());
            // cache jQuery columns
            that._columns = $("." + that.CLASS_COLUMN, that._container);
            that._table.before(that._container);

            that._table.on("draw.dt", function() {
                that.checkTableHeight();
            });
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
                $ths = that._table.find("thead > tr:first-child > th"),    // get all table headers
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
                    left: Math.ceil($th.position().left + thWidth),
                    height: that._tableHeight
                });
                // save the prev col item for speed rather than using the .prev() function
                $col.data(that.DATA_TAG_PREV_COL, $cols[ i - 1 ]);
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
                diff = 0,
                $nextCol,
                posPlusDiff;
            if (that._isDragging) {
                // caculate the difference between where the mouse has moved to
                // and the left position of the column that is being dragged
                diff = Math.ceil(event.clientX - $col.offset().left);
                $nextCol = $col.next();
                posPlusDiff = Math.ceil($col.position().left + diff);
                if ($nextCol.length) {
                    // check whether neighbouring is still bigger than 10px if a resize
                    // takes place.
                    if (posPlusDiff < ($nextCol.position().left - that.options.minColumnWidth)) {
                        if (that.updateColumn($col, diff)) {
                            // col was resized so resize the neighbouring col too.
                            that.updateColumn($nextCol, diff < 0 ? Math.abs(diff) : -Math.abs(diff), true);
                        }
                    }
                } else {
                    // if we are expanding the last column
                    // or when shrinking: don't allow it to shrink smaller than the minColumnWidth
                    if(diff > 0 || (posPlusDiff > $col.prev().position().left + that.options.minColumnWidth) ) {
                        // very last col drag bar is being dragged here (expanded)
                        if(that.updateColumn($col, diff)) {
                            that.updateTableOnLastColumnMove($col, diff);
                        }
                    }
                }
                that.checkTableHeight();
            }
        },
        updateTableOnLastColumnMove: function($col, diff) {
            // update the table width with the next size to prevent the other columns
            // going crazy
            $col.css({
                left: Math.ceil($col.position().left + diff)
            });
            this._table.width( Math.ceil($col.position().left) );
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
                newWidth = Math.ceil(by + $col.data(that.DATA_TAG_WIDTH));
            //only resize to a min of 10px
            if (newWidth > that.options.minColumnWidth) {
                // get the actual <th> column of the table and set the new width
                $col.data(that.DATA_TAG_ITEM).css({
                    width: newWidth
                });
                // save the new width for the next mouse drag call
                $col.data(that.DATA_TAG_WIDTH, newWidth);
                if(nextColumn) {
                    // set the new let position of the dragged column (div)
                    $col.data(that.DATA_TAG_PREV_COL).css({
                        left: Math.ceil($col.data(that.DATA_TAG_ITEM).position().left)
                    });
                }
                if (that.options.scrollY) {
                    that.updateCells($col.index(), newWidth);
                }
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

        },

        /**
         * Initialise the vertical scrolling feature (scrollY)
         * @method initScroller
         * @returns null
         */
        initScroller: function() {
            var that = this;
            // Build required DOM elements.
            that.buildScrollerDom();
            // register when a scroll is performed inside the wrapping div
            // this then forces the tbody to scroll in-sync.
            that._scrollWrapper.on("scroll", that.onScroll());
            that._table.on("draw.dt", function() {
                that.syncRows();
                that.syncHeight();
            });
            $(window).resize(function() {
                that._scrollWrapper.width(that._wrapper.width());
            });
        },
        /**
         * Builds the required dom elements together for vertical scrolling 
         * @method buildScrollerDom
         * @returns null
         */
        buildScrollerDom: function() {
            var that = this;
            // add class to wrapper for better css conditional selection
            that._wrapper.addClass(that.CLASS_SCROLLER_HASWRAPPER);
            // scroll wrapper container - where the scroll-y bar appears
            that._scrollWrapper = $("<div class='" + that.CLASS_SCROLLER_WRAPPER + "'></div>");
            // move it over the tbody content
            that._scrollWrapper.css("margin-top", that._tableBody.position().top);
            // create an inner div to mimic the height of the tbody content
            that._scrollContent = $("<div class='" + that.CLASS_SCROLLER_CONTENT_WRAPPER + "'></div>");
            // shrink the wrapper to the defined height so that the scroll bar appears
            that._scrollWrapper.height(that.options.scrollY);
            // fix the content to the tbody original height
            that._scrollContent.height(that._tableBody.height());
            // resize the tbody to the desired height - same as the overlapping wrapper div
            that._tableBody.height(that.options.scrollY);

            // make the wrapper a little bigger than the table so that the scroll-y bar
            // doesn't appear inside, overlapping the content
            that._scrollWrapper.width(that._wrapper.width());

            // hide the overflowing (y) tbody content
            that._tableBody.css("overflow-y", "hidden");
            // add all the new scroll controlling divs
            that._scrollWrapper.append(that._scrollContent);
            that._wrapper.prepend(that._scrollWrapper);
        },
        /**
         * Event listener function for the scroll wrapper scrolling events
         * @method onScroll
         * @returns {function}
         */
        onScroll: function() {
            var that = this,
                scrollWrapper = that._scrollWrapper;
            return function() {
                // scroll the tbody accordingly
                // i.e. keep the tbody scroll in-sync with the scrolling wrapper
                that._tableBody.scrollTop(scrollWrapper.scrollTop());
            };
        },
        /**
         * Update the cells within this column to align with the header on column resize.
         * @method updateCells
         * @param {integer} index column index which was changed
         * @param {interger} width the new width of the column in pixels
         */
        updateCells: function(index, width) {
            var that = this,
                $trs = that._tableBody.find("tr");
            for (var i = 0, l = $trs.length; i < l; i++) {
                $trs.eq(i).find("td").eq(index).css("width", width);
            }
            if(that._updatedColumns.indexOf(index) < 0) {
                that._updatedColumns.push(index);
            }
        },
        /**
         * After a pagination DataTables draws the cells new,
         * this function adjusts the cells back to the correct width
         * in sync with the headers
         * @method syncRows
         * @returns null
         */
        syncRows: function() {
            var that = this,
                $ths,
                $trs,
                index;
            if (that._updatedColumns.length) {
                $ths = that._table.find("thead th");
                $trs = that._tableBody.find("tr");
                for(var i = 0, l = $trs.length; i < l; i++) {
                    for(var ii = 0, ll = that._updatedColumns.length; ii < ll; ii++) {
                        index = that._updatedColumns[ii];
                        $trs.eq(i).find("td").eq(index).css("width", $ths.eq(index).css("width"));
                    }
                }
            }
        },
        /**
         * After a draw (like page change), the content height might not be longer
         * than the set scrollY value. Therefore the Y scroll bar might not be needed.
         * Update the content height accordingly to show or hide the scroll bar.
         * @method syncHeight
         * @returns null
         */
        syncHeight: function() {
            var that = this,
                // make the tbody full height (auto) again to get the new content height
                height = that._tableBody.css("height", "auto").height();
            // reset the tbody height back after calculation
            that._tableBody.height(that.options.scrollY);
            // adjust scroll content div to the new table height
            // this is needed if the content of the next page for example doesn't fill the entire height
            // but the scroll bar is still visible
            that._scrollContent.height(height);
        },
        /**
         * @method clearCache
         * @returns null
         */
        clearCache: function() {
            var that = this;
            that._columns = [];
            that._updatedColumns = [];
        },
        /**
         * @method redraw
         * @returns null
         */
        redraw: function() {
            var that = this;
            that._container.remove();
            that.clearCache();
            that.init(that._dtInstance);
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
            // next DOM tick to make sure that
            // DT really is finished, everytime!
            setTimeout(function() {
                new ColResize(settings, opts);
            }, 0);
        }
    });

    // API augmentation
    $.fn.dataTable.Api.register( "colResize.redraw()", function () {
        this.context[0].colResize.redraw();
        return this;
    } );

    return ColResize;
}));