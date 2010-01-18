// namespace for script variables
var OntoWiki = {};

// how fast should we fade, slide, ...
var effectTime = 250;

// integer value of the dragNdrop z-index and context-menu z-index
var dragZIndex = 1000;
var menuZIndex = 1000;

// number of chars entered before autocompleting starts
var autoCompleteMinChars = 3;

// time to wait before autocompleting (ms)
var autoCompleteDelay = 500;

// The id counter is used to create autoids
idCounter = 1;

// This array is used to temp. store href attributes
tempHrefs = new Array();

/*
 * core css assignments
 */
$(document).ready(function() {
    // the body gets a new class to indicate that javascript is turned on
    $('body').removeClass('javascript-off').addClass('javascript-on');

    // the body gets the contextmenu clone container
    $('body').append('<div class="contextmenu-enhanced"></div>');

    // every click fadeout (and remove) all contextmenus
    // every click un-marks all marked elements
    $('html').click(function(){
        $('.contextmenu-enhanced .contextmenu').fadeOut(effectTime, function(){ $(this).remove(); })
        $('.marked').removeClass('marked');
    });
    
    // add section resizer
    $('.section-sidewindows').append('<span class="resizer-horizontal"></span>');
    
    // give it a nice (non-standard) cursor
    if ($.browser.safari) {
        $('.resizer-horizontal').css('cursor', 'col-resize');
    } else if ($.browser.mozilla) {
        $('.resizer-horizontal').css('cursor', 'ew-resize');
    }
    
    // make resizer draggable
    // draggables need an explicit (inline) position
    $('.section-sidewindows .resizer-horizontal').css('position', 'absolute');
    var documentHeight = $(document).height();
    $('.section-sidewindows .resizer-horizontal')
        .height(documentHeight + 'px')
        .draggable({
            axis: 'x', 
            zIndex: dragZIndex,  
            cursor: 'move', 
            start: function(event, ui) {
                $('.section-sidewindows .resizer-horizontal').addClass('dragging');
            }, 
            stop: function(event, ui) {
                var resizerWidth = $('.section-sidewindows .resizer-horizontal').width();
                var sectionRatioPercent = Math.round((((event.pageX) / $(document).width())) * 1000) * 0.1;
                setSectionRatio(sectionRatioPercent);
                sessionStore('sectionRation', sectionRatioPercent, {encode: true});
                // jQuery UI bug in Safari
                $('.section-sidewindows').css('position', 'absolute');
                $('.section-sidewindows .resizer-horizontal').removeClass('dragging');
            }
        });
    if (typeof sectionRatio != 'undefined') {
        setSectionRatio(sectionRatio);
    }
    
    // inner labels
    $('input.inner-label').innerLabel().blur();
    
    // prefix preserving inputs
    $('input.prefix-value').prefixValue();
    
    $('.editable').makeEditable();
    
    // autosubmit
    $('a.submit').click(function() {
        // submit all forms inside this submit button's parent window
        var formName = $(this).attr('id');
        var formSpec = formName ? '[name=' + formName + ']' : '';
        
        $(this).parents('.window').eq(0).find('form' + formSpec).each(function() {
            if ($(this).hasClass('ajaxForm')) {
                // submit asynchronously
                var actionUrl = $(this).attr('action');
                var method    = $(this).attr('method');
                var data      = $(this).serialize();
                
                if ($(this).hasClass('reloadOnSuccess')) {
                    var mainContent = $(this).parents('.content.has-innerwindows').eq(0).children('.innercontent');
                    var onSuccess = function() {
                        mainContent.load(document.URL);
                    }
                }
                // alert(data);
                if (method == 'post') {
                    $.post(actionUrl, data, onSuccess);
                } else {
                    $.get(actionUrl, data, onSuccess);
                }
                
                this.reset();
            } else {
                // submit normally
                this.submit();
            }
        })
    });
    
    /*
     *  simulate Safari behaviour for other browsers
     *  on return/enter, submit the form
     */
    if (!$.browser.safari) {
        $('.submitOnEnter').keypress(function(event) {
            // return pressed
            if (event.target.tagName.toLowerCase() != 'textarea' && event.which == 13) {
                $(this).parents('form').submit();
            }
        });
    }
    
    // autosubmit
    $('a.reset').click(function() {
        // reset all forms inside this submit button's parent window
        $(this).parents('.window').find('form').each(function() {
            document.forms[$(this).attr('name')].reset();
        })
    });
    
    // init new resource based on type
    $('.init-resource').click(function() {
       var type       = $(this).closest('.window').find('*[typeof]').eq(0).attr('typeof');
       createInstanceFromClassURI(type);
    });
    
    $('.edit.save').click(function() {
        RDFauthor.commitEditing();
    });
    
    $('.edit.cancel').click(function() {
        // reload page
        window.location.href = window.location.href;
        // RDFauthor.cancelEditing();
        // var mainInnerContent = $('.window .content.has-innerwindows').eq(0).find('.innercontent');
        // mainInnerContent.load(document.URL);
        // $('.edit-enable').click();
    })
    
    $('.icon-edit').click(function() {
        var element = this;
        rdfauthor_loaded_callback = function() {
            RDFauthor.setOptions({
                anchorElement: '.innercontent', 
                onSubmitSuccess: function () {
                    // var mainInnerContent = $('.window .content.has-innerwindows').eq(0).find('.innercontent');
                    // mainInnerContent.load(document.URL);

                    // tell RDFauthor that page content has changed
                    // RDFauthor.invalidatePage();

                    $('.edit').each(function() {
                        $(this).fadeOut(effectTime);
                    });
                    $('.edit-enable').removeClass('active');

                    // reload whole page
                    window.location.href = window.location.href;
                }, 
                onCancel: function () {
                    $('.edit').each(function() {
                        $(this).fadeOut(effectTime);
                    });
                    $('.edit-enable').removeClass('active');
                }, 
                saveButtonTitle: 'Save Changes', 
                cancelButtonTitle: 'Cancel', 
                title: $('.section-mainwindows .window').eq(0).children('.title').eq(0).text(), 
                'defaultGraph': defaultGraph, 
                'defaultResource': defaultResource
            });
            
            RDFauthor.startInline($(element).closest('td'));
            
            // hide inine edit for whole page
            $('.edit-enable').hide();
            // show submit/cancel buttons
            $('.edit').each(function() {
                $(this).fadeIn(effectTime);
            });
        };
        
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = widgetBase + 'src/loader.js';
        document.getElementsByTagName('head')[0].appendChild(s);
    });
    
    // edit mode
    $('.edit-enable').click(function() {
        if ($(this).hasClass('active')) {
            RDFauthor.cancelEditing();
            
            
            $('.edit').each(function() {
                $(this).fadeOut(effectTime);
            })
            $(this).removeClass('active');
        } else {
            rdfauthor_loaded_callback = function () {
                RDFauthor.setOptions({
                    anchorElement: '.innercontent', 
                    onSubmitSuccess: function () {
                        // var mainInnerContent = $('.window .content.has-innerwindows').eq(0).find('.innercontent');
                        // mainInnerContent.load(document.URL);

                        // tell RDFauthor that page content has changed
                        // RDFauthor.invalidatePage();

                        $('.edit').each(function() {
                            $(this).fadeOut(effectTime);
                        });
                        $('.edit-enable').removeClass('active');

                        // reload whole page
                        window.location.href = window.location.href;
                    }, 
                    onCancel: function () {
                        $('.edit').each(function() {
                            $(this).fadeOut(effectTime);
                        });
                        $('.edit-enable').removeClass('active');
                    }, 
                    saveButtonTitle: 'Save Changes', 
                    cancelButtonTitle: 'Cancel', 
                    title: $('.section-mainwindows .window').eq(0).children('.title').eq(0).text(), 
                    'defaultGraph': defaultGraph, 
                    'defaultResource': defaultResource
                });
                
                // RDFauthor.startEditing();
                RDFauthor.startInline('*[about] td:nth-child(2)');
                // RDFauthor.startInline('table tr td');
                
                $('.edit').each(function() {
                    $(this).fadeIn(effectTime);
                })
                $(this).addClass('active');
            };
            
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = widgetBase + 'src/loader.js';
            document.getElementsByTagName('head')[0].appendChild(s);
        }
    });
    
    // add property
    $('.property-add').click(function() {
        RDFauthor.setOptions({
            anchorElement: '.innercontent', 
            onSubmitSuccess: function () {
                var mainInnerContent = $('.window .content.has-innerwindows').eq(0).find('.innercontent');
                mainInnerContent.load(document.URL);
                
                // tell RDFauthor that page content has changed
                RDFauthor.invalidatePage();
                
                $('.edit').each(function() {
                    $(this).fadeOut(effectTime);
                });
                $('.edit-enable').removeClass('active');
            }, 
            onCancel: function () {
                $('.edit').each(function() {
                    $(this).fadeOut(effectTime);
                });
                $('.edit-enable').removeClass('active');
            }, 
            saveButtonTitle: 'Save Changes', 
            cancelButtonTitle: 'Cancel'
        });
        
        RDFauthor.newProperty();
    });
    
    $('.tabs').children('li').children('a').click(function() {
        var url = $(this).attr('href');
        
        $(this).parents('.tabs').children('li').removeClass('active');
        $(this).parent('li').addClass('active');
                
        if (url.match(/#/)) {
            var wnd = $(this).parents('.window').eq(0);
            wnd.children('div').children('.content').removeClass('active-tab-content');
            wnd.children('div').children('.content' + url).addClass('active-tab-content');
            return false;
        } else {
            return true;
        }
    })
    
    // box display/hide    
    // $('.toggle-module-display').click(function() {
    //     var module = $('.window#' + $(this).attr('id').replace('toggle-', ''));
    //     var menuEntry = $(this);
    //     if (module.length) {
    //         if (module.hasClass('is-disabled')) {
    //             module.removeClass('is-disabled');
    //             module.fadeIn(effectTime, function() {
    //                 menuEntry.text(menuEntry.text().replace('Show', 'Hide'));
    //             })
    //         } else {
    //             module.fadeOut(effectTime, function() {
    //                 module.addClass('is-disabled');
    //                 menuEntry.text(menuEntry.text().replace('Hide', 'Show'));
    //             });
    //         }
    //     }
    // })
    
    
    // make sidebar windows sortable
/*    if ($('.section-sidewindows .window').length) {
        $('.section-sidewindows .window .title').css('cursor', 'move');
        $('.section-sidewindows').sortable({
            items: '.window', 
            handle: '.title', 
            // containment: 'parent', 
            opacity: 0.8, 
            axis: 'y', 
            cursor: 'move', 
            revert: true, 
            start: function(event, ui) {
                ui.helper.css('width', $('.section-sidewindows .window').eq(0).width() + 'px');
                ui.helper.css('margin-left', '0');
            }, 
            update: function() {
                var moduleOrder = $('.section-sidewindows').sortable('serialize', {
                    expression: '(.*)', 
                    key: 'value'
                });
                sessionStore('moduleOrder', moduleOrder, {encode: false, namespace: 'Module_Registry'});
            }
        });
        // draggables need an explicit (inline) position
        $('.section-sidewindows').css('position', 'absolute');
    }
*/
    
    // make tabs sortable
    // if ($('#tabs').children().length) {
    //     $('#tabs').sortable({
    //         axis: 'x', 
    //         // containment: 'parent', 
    //         opacity: 0.8, 
    //         revert: true, 
    //         update: function() {
    //             var tabOrder = $('#tabs').sortable('serialize', {
    //                 expression: '(.*)', 
    //                 key: 'value'
    //             });
    //             sessionStore('tabOrder', tabOrder, {encode: false, namespace: 'ONTOWIKI_NAVIGATION'});
    //         }
    //     });
    // }
    
    // inline widgets
    $('.inline-edit-local').live('click', function() {
        // RDFauthor.startInline($(this).closest('.editable').get(0));
    })
    
    //-------------------------------------------------------------------------
    //---- liveQuery triggers
    //-------------------------------------------------------------------------
    
    // expandables
    $('.expandable').livequery(function() {
        $(this).expandable();
    });

    // create showResourceMenu toogle where wanted and applicable
    $('a.hasMenu[about]').livequery(function() {
        $(this).createResourceMenuToggle();
    });
    $('a.hasMenu[resource]').livequery(function() {
        $(this).createResourceMenuToggle();
    });

    // All RDFa elements with @aboutor or @resource attribute are resources
    $('*[about]').livequery(function() {
        $(this).addClass('Resource');
    });
    $('*[resource]').livequery(function() {
        $(this).addClass('Resource');
    });
    
    
    var liveSearchMinChars = 3;
    var liveSearchTimeout  = 250; // ms
    var count = 0;
    
    // live-search
    $('input.live-search').livequery('keyup', function() {
        var localCount = ++count;
        var searchInput = $(this);
        
        window.setTimeout(function() {
            // no more input, so do something
            if (count == localCount) {
                if (($(searchInput).val().length >= liveSearchMinChars)) {
                    $(searchInput).parents('.content').children('ul').hide();
                    if ($(searchInput).parents('.content').children('.messagebox').length < 1) {
                        $(searchInput).parents('.content').append(
                            '<div style="display:none" class="messagebox info">Not implemented yet.</div>');
                        $(searchInput).parents('.content').children('.messagebox').fadeIn(effectTime);
                    }
                } else {
                    // load normal hierarchy
                    $(searchInput).parents('.content').children('ul').fadeIn(effectTime);
                    $(searchInput).parents('.content').children('.messagebox').remove();
                }                
            }
        }, liveSearchTimeout);
    });
    
    /* RESOURCE CONTEXT MENUS */
    $('.has-contextmenus-block .Resource').livequery(function() {
        $(this).append('<span class="button"></span>');
    });
    
    $('.has-contextmenus-block .Resource span.button').livequery(function() {
        $(this).mouseover(function() {
            hideHref($(this).parent());
            $('.contextmenu-enhanced .contextmenu').remove(); // remove all other menus
        })
        .click(function(event) {
            showResourceMenu(event);
        }).mouseout(function() {
            showHref($(this).parent())
        });
    })
    
    var loadChildren = function(li) {
        var ul;
        var a   = $(li).children('.hierarchy-toggle');
        var uri = $(li).children('.has-children').attr('about');
        
        var toggleDisplay = function(ul) {
            if (ul.css('display') != 'none') {
                ul.slideUp(effectTime, function() {
                    a.removeClass('open');
                    sessionStore('hierarchyOpen', 'value=' + encodeURIComponent(uri), {method: 'unset', withValue: true});
                });
            } else {
                ul.slideDown(effectTime, function() {
                    a.addClass('open');
                    sessionStore('hierarchyOpen', 'value=' + encodeURIComponent(uri), {method: 'push', withValue: true});
                });
            }
        }
        
        var serviceUrl = urlBase + 'service/hierarchy?entry=' + encodeURIComponent(uri);
        $.get(serviceUrl, function(data) {
            ul = $(data);
            ul.css('display', 'none');
            $(li).append(ul);
            toggleDisplay(ul);
        })
    }
    
    $('ul .hierarchy .has-children').livequery(function() {
        // is open and should have children but has none
        if ($(this).prev('.hierarchy-toggle').hasClass('open') && $(this).parent().children('ul').length < 1) {
            loadChildren($(this).parent());
        }
    });
    
    $('.hierarchy-toggle').livequery('click', function(event) {
        var ul;
        var a   = $(this);
        var uri = a.next().attr('about');
        
        var toggleDisplay = function(ul) {
            if (ul.css('display') != 'none') {
                ul.slideUp(effectTime, function() {
                    a.removeClass('open');
                    sessionStore('hierarchyOpen', 'value=' + encodeURIComponent(uri), {method: 'unset', withValue: true});
                });
            } else {
                ul.slideDown(effectTime, function() {
                    a.addClass('open');
                    sessionStore('hierarchyOpen', 'value=' + encodeURIComponent(uri), {method: 'push', withValue: true});
                });
            }
        }
        
        if ($(this).parent('li').children('ul').length < 1) {
            // TODO: Ajax
            var serviceUrl = urlBase + 'service/hierarchy?entry=' + encodeURIComponent(uri);
            $.get(serviceUrl, function(data) {
                ul = $(data);
                ul.css('display', 'none');
                a.parent('li').append(ul);
                toggleDisplay(ul);
            })
        } else {
            ul = a.parent('li').children('ul');
            toggleDisplay(ul);
        }
        
        event.stopPropagation();
    })
    
    $('tbody a.toggle').live('click', function() {
        $(this).closest('tbody').toggleClass('closed');
    })
    
    // site is ready, processing is finished
    $('body').removeClass('is-processing');

    // enhance every window with buttons, menu and resizer
    // this must be done at the end of the onready block (because we generate the menu automatically)
    $('.window').enhanceWindow();    
}) // $(document).ready




