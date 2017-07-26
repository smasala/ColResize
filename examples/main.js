(function(window, document, $) {

    $(document).ready(function() {
        var ops = {
            colResize: {
                scrollY: 200
            },
            columns: [{title: "Name"}, {title: "Job"}, {title: "Salary"}],
            data: [
                ["Fred", "Investment Banker", "1,000,000.00"],
                ["Sally", "CEO", "5,000,000.00"],
                ["George", "Real Estate Broker", "1,800,000.00"],
                ["Fred1", "Investment Banker", "1,000,000.00"],
                ["Sally1", "CEO", "5,000,000.00"],
                ["George1", "Real Estate Broker", "1,800,000.00"],
                ["Fred2", "Investment Banker", "1,000,000.00"],
                ["Sally2", "CEO", "5,000,000.00"],
                ["George2", "Real Estate Broker", "1,800,000.00"],
                ["Fred3", "Investment Banker", "1,000,000.00"],
                ["Sally3", "CEO", "5,000,000.00"],
                ["George3", "Real Estate Broker", "1,800,000.00"],
                ["Fred4", "Investment Banker", "1,000,000.00"],
                ["Sally4", "CEO", "5,000,000.00"],
                ["George4", "Real Estate Broker", "1,800,000.00"]
            ],
            autoWidth: false,
            scrollX: false
        };
        var t = $("table").DataTable($.extend(true, {}, ops));
        $("button").on("click", function() {
            t.destroy();
            $("table").empty();
            t = $("table").DataTable($.extend(true, {}, ops));
        });
    });
    
})(window, document, jQuery);