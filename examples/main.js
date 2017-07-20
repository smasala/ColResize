(function(window, document, $) {

    $(document).ready(function() {
        $("table").DataTable({
            colResize: {
                scrollY: 200
            },
            autoWidth: false,
            scrollX: false,
            scrollY: ""
        });
    });
    
})(window, document, jQuery);