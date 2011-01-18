// create object
function dataProvider(){};

// get knowledgeBase List
dataProvider.prototype.getKBList = function(){
    var uri = urlBase+"module/get?name=modellist&json=true";
    var temp = "#kbTemplate";
    var cont = "#kb-listholder";
    
    if( typeof localStorage["ontowiki.bases"] != 'undefined' && localStorage["ontowiki.bases"] != null
        && connectionStatus == "offline" ){
        this.renderData($.parseJSON(localStorage["ontowiki.bases"]), temp, cont);
    }else{
        this.getModule(uri, temp, cont, "bases");
    }
}

// instance
dataProvider.prototype.getInstance = function(url){
    var temp = "#propsTemplate";
    var cont = "#prop-list";
    
    var data = $.parseJSON(localStorage["ontowiki.inst."+selectedNavigationEntry.url+"."+url]);
    if( typeof data != 'undefined' && data != null
        && connectionStatus == "offline" ){
        this.renderData(data, temp, cont);
        $(document).trigger('instance.done');
    }else{
        var dp = this;
        $.get(url, function(data){
            // save 
            localStorage["ontowiki.inst."+selectedNavigationEntry.url+"."+url] = data;
            // parse            
            //console.log(data);
            var dataArr = $.parseJSON(data);
            //console.log(dataArr);
            
            // render
            dp.renderData(dataArr, temp, cont);
            $(document).trigger('instance.done');
        });
    }
}

// instance list 
dataProvider.prototype.getInstanceList = function(url){
    var temp = "#instTemplate";
    var cont = "#inst-list";
    
    var data = $.parseJSON(localStorage["ontowiki.inst."+selectedNavigationEntry.url+"."+url]);
    if( typeof data != 'undefined' && data != null
        && connectionStatus == "offline" ){
        this.renderData(data, temp, cont);
        $("#inst-statusbar").empty().append( $(data['statusbar']) );
        $(document).trigger('instance.list.done');
    }else{
        var dp = this;
        $.get(url, function(data){
            // save 
            localStorage["ontowiki.inst."+selectedNavigationEntry.url+"."+url] = data;
            // parse
            var dataArr = $.parseJSON(data);
            // render
            dp.renderData(dataArr, temp, cont);
            $("#inst-statusbar").empty().append( $(dataArr['statusbar']) );
            $(document).trigger('instance.list.done');
        });
    }
}

// navigation
dataProvider.prototype.getNavigation = function(event, uri){
    if( typeof uri == 'undefined' ) uri = selected_model;
    var temp = "#navTemplate";
    var cont = "#nav-list";
    
    if( typeof localStorage["ontowiki.nav."+uri] != 'undefined' && localStorage["ontowiki.nav."+uri] != null
        && connectionStatus == "offline" ){
        this.renderData($.parseJSON(localStorage["ontowiki.nav."+uri]), temp, cont);
        if(event == "reset"){
            $.get(urlBase + 'model/select/?m=' + uri, function(){})
        }
        $(document).trigger('navigation.done');
    }else{
        switch(event){ 
            case 'navigateDeeper':
                navigationEvent(event, uri);
                break;
            case 'reset':
                var url = urlBase + 'model/select/?m=' + uri;
                $.get(url, function(data){    
                    navigationEvent(event);
                })
                break;
            default:
                navigationEvent(event);
                break;
        }
    }
};
dataProvider.prototype.saveNavigation = function(data){
    var temp = "#navTemplate";
    var cont = "#nav-list";
    // data
    var dataArr = $.parseJSON(data);
    
    // get uri
    var uri = dataArr["rootEntry"];
    if( uri.length < 1 ) uri = selected_model;
    
    // save to store
    localStorage["ontowiki.nav."+uri] = data;

    this.renderData(dataArr, temp, cont);
    
    $(document).trigger('navigation.done');
};

// renders data
dataProvider.prototype.renderData = function(data, template, container){
    // clear
    $(container).empty();
    // render
    $(template).tmpl(data).appendTo(container);
    // try refresh listview
    try{
        $(container).listview("refresh");
    }catch(e){} // ignore all errors
}

// get module data and render it
dataProvider.prototype.getModule = function(uri, template, container, localVar){
    var dp = this;
    // show loader
    $.mobile.pageLoading();
    $.get(uri, function(data){
        $.mobile.pageLoading(true);
        
        var objdata = $.parseJSON(data);
        objdata = objdata["data"];
        
        // save to store
        localStorage["ontowiki."+localVar] = $.toJSON(objdata);
        
        // renderData
        dp.renderData(objdata, template, container);
    });
}
var provider = new dataProvider();

function getKBList(){
    provider.getKBList();
}