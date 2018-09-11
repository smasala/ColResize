/**! ColResize 2.6.0
 * ©2017 Steven Masala
 */

/**
 * @summary ColResize
 * @description Provide the ability to resize the columns in a DataTable
 * @version 2.6.0
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
        version: "2.6.0",
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
            scrollY: false,
            /**
             * Resizes the table instead of shrinking the next column
             * when a specific column is resized
             * @property resizeTable
             * @public
             * @type {boolean}
             * @default false
             */
            resizeTable: false
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
         * Current jquery "th" elements
         * @property _tableHeaders
         * @type {jQuery}
         * @private
         * @default null
         */
        _tableHeaders: null,
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
         * Events cache object to store registered events and listeners
         * @example 
         *      {
         *          "click": [ [$el1, callbackFunction], [$el2, callbackFunction2] ]
         *      }
         * @private
         * @property _events
         * @type {object}
         * @default
         */
        _events: {},
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
            that._tableHeaders = that._table.find("thead > tr:first-child > th");
            that._addEvent(that._table, "stateSaveParams.dt", function(_event, _settings, data) {
                that._storeWidthData(data);
            });
            that.buildDom();
            that._addEvent(that._table, "destroy.dt", function() {
                that.destroy();
            }, true);
        },
        /**
         * Builds the draggable components together and places
         * them in the DOM (above the actual table)
         * @method buildDom
         * @returns null
         */
        buildDom: function() {
            var that = this,
                redraw = !!(that._wrapper),
                defaultWidths;
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
            //get any default widths from the store
            defaultWidths = that.getStoreWidths();
            // set the table dimensions correctly
            that.calcTableDimensions(defaultWidths);
            // build and insert columns into container
            that._container.append(that.buildColDoms());
            // resave the state, they get lost the second time.
            if (defaultWidths && defaultWidths.length) {
                that._dtInstance.state.save();
            }
            // cache jQuery columns
            that._columns = $("." + that.CLASS_COLUMN, that._container);
            that._table.before(that._container);
            that.checkTableHeight();
            that.initEvents();
        },
        /**
         * Get all the widths for columns out of the datatable storage when state saving is enabled
         * @returns {Array<number>|null}
         */
        getStoreWidths: function() {
            var that = this,
                state = that._dtInstance.state.loaded();
            if (state && state.colResize && state.colResize.widths) {
                return state.colResize.widths;
            }
        },
        /**
         * Register all events needed on ColResize init
         * @method initEvents
         * @returns null
         */
        initEvents: function() {
            var that = this;
            that._addEvent(that._table, "draw.dt", function() {
                // set timeout so that table dom manipulation can be done first
                setTimeout(function() {
                    that.checkTableHeight();
                }, 0);
            });
            that._addEvent(that._dtInstance, "column-reorder", function() {
                that.redraw();
            }, true);
            that._addEvent(that._table, "column-visibility.dt", function() {
                that.redraw();
            }, true);
            if (that.options.scrollY) {
                that._addEvent(that._wrapper, "scroll", function() {
                    that._scrollWrapper.css("right", 0 - that._wrapper.scrollLeft());
                });
            }
        },
        /**
         * Initialises the table width and height
         * @method calcTableDimensions
         * @param widths {Array<number>|null} [default=null] if passed then sets the 
         *                                      default width state of the columns
         * @returns null
         */
        calcTableDimensions: function(widths) {
            var that = this,
                $th,
                thWidth = 0,
                $ths = that._tableHeaders,    // get all table headers
                totalWidth = 0;
            for (var i = 0, l = $ths.length; i < l; i++) {
                $th = $ths.eq(i);   // get individual <th>
                thWidth = widths ? widths[i] : that._getWidth($th); // get <th> current/correct width
                $th.css("width", thWidth);
                totalWidth += thWidth;
            }
            // set the table width correctly
            that._table.css("width", totalWidth);
            // and it's container
            if (that.options.scrollY) {
                totalWidth = totalWidth + 20;
            }
            that._container.width(totalWidth);
        },
        /**
         * Creates the draggable columns, add the necessary drag events 
         * @method buildColDoms
         * @return jQuery[] actual draggable columns as jquery objects
         */
        buildColDoms: function() {
            // replicate table header widths
            var that = this,
                $ths = that._tableHeaders,    // get all table headers
                $th,
                $cols = [],
                $col,
                thWidth = 0;
            
            for (var i = 0, l = $ths.length; i < l; i++) {
                $th = $ths.eq(i);   // get individual <th>
                thWidth = $th.outerWidth(); // get <th> current width
                $col = $("<div class='" + that.CLASS_COLUMN + "'></div>"); // create drag column item <div>
                // place the drag column at the end of the <th> and as tall as the table itself
                $col.css({
                    left: Math.ceil($th.position().left + thWidth)
                });
                // save the prev col item for speed rather than using the .prev() function
                $col.data(that.DATA_TAG_PREV_COL, $cols[ i - 1 ]);
                // save the current width
                $col.data(that.DATA_TAG_WIDTH, thWidth);
                // save the <th> element reference for easy access later
                $col.data(that.DATA_TAG_ITEM, $th);
                // register necessary events
                that.registerEvents($col);
                // push created drag column element in array
                $cols.push($col);
            }
            return $cols;
        },

        _storeWidthData: function(data) {
            var that = this,
                $ths = that._tableHeaders,
                $th,
                widths = [];
            for (var i = 0, l = $ths.length; i < l; i++) {
                $th = $ths.eq(i);   // get individual <th>
                widths.push(that._getWidth($th)); // get <th> current/correct width
            }
            data.colResize = {
                widths: widths
            }
        },
        /**
         * Get the current or correct th element width.
         * If the th element has an inline width set "style='width: 100px'" then this
         * the return value. If it doesn't, then the calculated "outerWidth()" is returned.
         * 
         * minColumnWidth value always wins if greater than the calculated width.
         * @method _getWidth
         * @param $th {jQuery} th jquery element
         * @returns {integer|float}
         */
        _getWidth: function($th) {
            var that = this,
                width;
            if (typeof $th[0].style.width === "string" && $th[0].style.width.indexOf("px") >= 1) {
                width = parseFloat($th[0].style.width);
            } else {
                width = $th.outerWidth();
            }
            return width < that.options.minColumnWidth ? that.options.minColumnWidth : width;
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
                    $(that._table).trigger($.Event( "column-resized.dt" ), [$col.index(), $col.data(that.DATA_TAG_ITEM).outerWidth()] );
                    that._dtInstance.state.save();
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
                            if (!that.options.resizeTable) {
                                // col was resized so resize the neighbouring col too.
                                that.updateColumn($nextCol, diff < 0 ? Math.abs(diff) : -Math.abs(diff), true);
                            } else {
                                that._recalcPositions();
                            }
                        }
                    }
                } else {
                    // if we are expanding the last column
                    // or when shrinking: don't allow it to shrink smaller than the minColumnWidth
                    if(diff > 0 || (posPlusDiff > $col.prev().position().left + that.options.minColumnWidth) ) {
                        if(that.updateColumn($col, diff)) {
                            // very last col drag bar is being dragged here (expanded)
                            that.updateTableOnLastColumnMove($col, diff);
                        }
                    }
                }
                that.checkTableHeight();
            }
        },
        updateTableOnLastColumnMove: function($col, diff) {
            var that = this;
            // update the table width with the next size to prevent the other columns
            // going crazy
            $col.css({
                left: Math.ceil($col.position().left + diff)
            });
            that.calcTableDimensions();
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
         * Repositions all draggable columns and recalculates
         * all table dimensions
         * @method _recalcPositions
         * @returns null
         */
        _recalcPositions: function() {
            var that = this,
                pos = that._table.position().left,
                $th;
            for (var i = 0, l = that._tableHeaders.length; i < l; i++) {
                $th = that._tableHeaders.eq(i);
                pos = pos + $th.outerWidth();
                that._columns.eq(i).css("left", pos);
            }
            that.calcTableDimensions();
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
                topMarg = 0,
                newHeight = that._table.outerHeight();
            if (newHeight !== that._tableHeight) {
                that._tableHeight = newHeight;
                // convert the "px" value to just a number
                topMarg = parseFloat(that._table.css("margin-top"));
                // if the table is empty, then don't show the column bars inside the tbody
                // as they overlap the empty text which has colspan across the table.
                if (that._tableBody.find("td.dataTables_empty").length) {
                    newHeight = (newHeight - (newHeight - that._tableBody.position().top)) - topMarg ;
                }
                //set the the position and height of all the draggable columns
                that._columns.css({
                    height: newHeight,
                    top: topMarg
                });
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
            that._addEvent(that._table, "draw.dt", function() {
                // set timeout so that table dom manipulation can be done first
                setTimeout(function() {
                    that.syncRows();
                    that.syncHeight();
                }, 0);
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

            // just wide enough to show the scrollbar
            that._scrollWrapper.width(20);

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
         * @method destroy
         * @returns null
         */
        destroy: function() {
            var that = this;
            that._container.remove();
            that._columns = [];
            that._updatedColumns = [];
            that._tableHeight = null;
            // remove al the events that were registered using the _addEvent(...) method
            for (var key in that._events) {
                if (that._events.hasOwnProperty(key)) {
                    var arr = that._events[key];
                    for(var i = 0, l = arr.length; i<l; i++) {
                        arr[i][0].off(key, arr[i][1]);
                    }
                }
            }
            that._events = {};
        },
        /**
         * Use this to add events to DOM elements that are not removed by a this.redraw() or table.empty()
         * or JS-GC, or even a DataTableInstance.destroy()
         * The events that are registered using this method are then removed on destroy or redraw so that
         * double events are not created.
         * This method registers an "on" event by default
         * @example
         *     this._addEvent($("table"), "draw.dt", function() {
         *          // do something
         *     });
         * @method _addEvent
         * @param $el {jQuery} element to register on
         * @param eventName {string} name of the event to register to
         * @param callback {function} callback function to call when the event is fired
         * @param once {boolean} [default=false] if true, registeres "once" instead of "on" event listener
         * @private
         */
        _addEvent: function($el, eventName, callback, once) {
            var that = this;
            that._events[eventName] = that._events[eventName] || [];
            that._events[eventName].push([$el, callback]);
            var obj = that._events[eventName][that._events[eventName].length - 1];
            obj[0][once ? "one" : "on"](eventName, obj[1]);
        },
        /**
         * @method redraw
         * @returns null
         */
        redraw: function() {
            var that = this;
            that.destroy();
            that.init(that._dtInstance);
        },
        /**
         * To be called instead of standard "dtInstance.column(index).visible()"
         * so that the table widths and draggable bar items can be redrawn.
         * @method visibility
         * @param index {integer} column index to change
         * @param visibility {boolean} set the column to visible or not
         * @returns null
         */
        visibility: function(index, visibility, redrawCalc) {
            var that = this,
                width = $(that._dtInstance.settings()[0].aoColumns[index].nTh).outerWidth();
            if (!visibility) {
                that._table.css("width", that._table.width() - width);
            } else {
                that._table.css("width", that._table.width() + width);
            }
            that._dtInstance.column(index).visible(visibility, redrawCalc);
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

    $.fn.dataTable.Api.register( "colResize.visible()", function (index, visibility, redrawCalc) {
        this.context[0].colResize.visibility(index, visibility, redrawCalc);
        return this;
    } );

    return ColResize;
}));