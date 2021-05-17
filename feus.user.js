// ==UserScript==
// @name        Folksonomy Engine user script
// @description Add Folksonomy Engine UI to Open Food Facts web pages.
// @namespace   openfoodfacts.org
// @version     2021-05-17T09:18
// @include     https://*.openfoodfacts.org/*
// @include     https://*.openproductsfacts.org/*
// @include     https://*.openbeautyfacts.org/*
// @include     https://*.openpetfoodfacts.org/*
// @include     https://*.pro.openfoodfacts.org/*
// @include     https://*.openfoodfacts.dev/*
// @include     http://*.productopener.localhost/*
// @exclude     https://analytics.openfoodfacts.org/*
// @exclude     https://api.folksonomy.openfoodfacts.org/*
// @exclude     https://*.wiki.openfoodfacts.org/*
// @exclude     https://wiki.openfoodfacts.org/*
// @exclude     https://support.openfoodfacts.org/*
// @exclude     https://translate.openfoodfacts.org/*
// @exclude     https://donate.openfoodfacts.org/*
// @exclude     https://hunger.openfoodfacts.org/*
// @exclude     https://monitoring.openfoodfacts.org/*
// @icon        http://world.openfoodfacts.org/favicon.ico
// @grant       GM_getResourceText
// @require     http://code.jquery.com/jquery-latest.min.js
// @require     http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @author      charles@openfoodfacts.org
// ==/UserScript==
/* eslint-env jquery */

// Product Opener (Open Food Facts web app) uses:
// * jQuery 2.1.4:                view-source:https://static.openfoodfacts.org/js/dist/jquery.js
//                                http://code.jquery.com/jquery-2.1.4.min.js
// * jQuery-UI 1.12.1:            view-source:https://static.openfoodfacts.org/js/dist/jquery-ui.js
//                                http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// * Tagify 3.x:                  https://github.com/yairEO/tagify
// * Foundation 5 CSS Framework:  https://sudheerdev.github.io/Foundation5CheatSheet/
//                                See also: https://github.com/openfoodfacts/openfoodfacts-server/pull/2987


// TODO

// Priority 1:
// * add edit feature
// * create lists of products with a chosen property/value pair; eg. list of all products containing: "toBeReviewed":"quickly"
// * organise a place for property documentation, and link FEUS to it (the wiki?)

// Priority 2:
// * // @updateURL   https://github.com/openfoodfacts/power-user-script/raw/master/OpenFoodFactsPower.user.js



(function() {
    'use strict';

    const pageType = isPageType(); // test page type
    console.log("FEUS - Folksonomy Engine User Script - 2021-05-17T09:18 - mode: " + pageType);

    const feAPI = "https://api.folksonomy.openfoodfacts.org";
    //const feAPI = "http://127.0.0.1:8000";
    //var bearer = "charlesnepote__U3bc56413-5254-4530-b9bd-febb3fc46a6f"; // local tests
    var authrenewal = 1 * 1 * 5 * 60 * 1000; console.log("authrenewal: " + authrenewal); // days * hours * minutes * seconds * ms
    var authHeader, loginWindow;
    //var myHeaders = new Headers();


    // css
    // See https://stackoverflow.com/questions/4376431/javascript-heredoc
    var css = `
/*
 * OFF web app already load jquery-ui.css but it doesn't work properly with "dialog" function.
 * We add the CSS this way so that the embedded, relatively linked images load correctly.
 * (Use //ajax... so that https or http is selected as appropriate to avoid "mixed content".)
 */

@import url("https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/redmond/jquery-ui.css");
@import url("https://rawgit.com/free-jqgrid/jqGrid/master/css/ui.jqgrid.css");
@import url("https://netdna.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css");

.feus {
  background-color: #edf2f8;
  margin-bottom: 1rem;
}

#free_prop_body *, #fe_new_row * {
  margin-bottom: 0.1rem !important;
}

.feus h2 {
  border-bottom: 1px solid #1eff3a;
}

#free_properties_form table {
  background: none;
}

#free_properties_form table tr td {
  padding: .4rem .4rem;
  vertical-align: middle;
}

#fe_new_row * {
  vertical-align: top !important;
}


`;
    // apply custom CSS
    var s = document.createElement('style');
    s.type = 'text/css';
    s.innerHTML = css;
    document.documentElement.appendChild(s);


    if (pageType === "edit"               || pageType === "product view"  ||
        pageType === "saved-product page" || pageType === "key"           ||
        pageType === "keys") {

        var code = $("#barcode").html();
        console.log("FEUS - barcode: " + code);
        var feAPIProductURL = feAPI + "/product/" + code;
        var editURL = feAPI + "/product";
        var addKVURL = feAPI + "/product";
        var deleteKVURL = feAPI + "/product";
        var feAPIProductsURL = feAPI + "/products";
        var feAPIKeysURL = feAPI + "/keys";
    }


    if (pageType === "product view") {
        displayFolksonomyKeyValues();
        //displayFolksonomyForm();
    }

    if (pageType === "edit") {
        displayFolksonomyForm();
    }

    if (pageType === "key") {
        // detect /key/test or /key/test/value/test_value
        let results = new RegExp('/key/([^/]*)(/value/)?(.*)').exec(window.location.href);
        if (results === null) {
            return null;
        }
        let key = results[1];
        let value = results[3];
        displayProductsWithKey(key, value);
    }


    if (pageType === "keys") {
        displayAllKeys();
    }


    /**
     * Display all the free properties created and filed by users.
     * Examples:
     *    * Photo_Front: To be updated
     *
     * @returns none
     */
    function displayFolksonomyKeyValues() {
        //$(".details").before(
        $("div[itemtype='https://schema.org/Product']").append(
            '<!-- ---- Folksonomy Engine ----- -->' +
            '<div id="free_properties_1" class="feus">' +
            '<h2>User properties (<span data-tooltip aria-haspopup="true" class="has-tip" data-position="top" data-alignment="left" title="Be aware the data model might be modified. Use at your own risk.">beta</span>)</h2>' +
            '<p id="fe_login_info"></p>' +
            '<p>This properties are created and filed by users for any kind of usages. Be aware the data model might be modified. Use at your own risk.</p>' +
            '<form id="free_properties_form">' +
            '<table>' +
            '<tr>' +
            '<th> </th>' +
            '<th class="prop_title">Property <a href="/keys">🔗</a></th>' +
            '<th class="val_title">Value</th>' +
            '</tr>' +
            '<tbody id="free_prop_body">' +
            '' +
            '</tbody>' +
            //'<button class="btn">Submit</button>' +
            //'<button class="btn" hx-get="/contact/1">Cancel</button>' +
            '<tr id="fe_new_row">' +
            '<td><input type="hidden" name="owner"> </td>' +
            '<td><input id="fe_form_new_property" name="property"></input><small id="fe_prop_err" style="visibility: hidden;">Can countain only minus letters, numbers, "_", and ":"</small></td>' +
            '<td><input id="fe_form_new_value" name="value"></input></td>' +
            '<td><span id="new_kv_button" class="button tiny round">Submit</span></td>' +
            '</tr>' +
            '</table>' +
            '</form>' +
            '</div>' +
            '<!-- ----- /Folksonomy Engine ----- -->');
        $("#fe_form_new_property").on("keyup", function() {
            const kControl = /^[a-z0-9_]+(\:[a-z0-9_]+)*$/;
            if (kControl.test($("#fe_form_new_property").val()) === false) {
                console.log("k syntax is bad!");
                $("#fe_prop_err").css("visibility", "visible");
            }
            else {
                $("#fe_prop_err").css("visibility", "hidden");
            }
        });

        const newKV = document.getElementById('new_kv_button');
        newKV.onclick = function() { isWellLoggedIn() ?
            addKV(code, $("#fe_form_new_property").val(), $("#fe_form_new_value").val(), ""):
            loginProcess(); };

        $.getJSON(feAPIProductURL, function(data) {
            if (data === null) {
                console.log("FEUS - displayFolksonomyKeyValues() - No data");
                return;
            }
            console.log("FEUS - displayFolksonomyKeyValues() - " + JSON.stringify(data));
            var index = 0;
            while (index < data.length) {
                // TODO: links to 1. a page listing all the products related to the property (k);
                //                2. a page listing all the products related to the property-value pair (k, v).
                // <input type="text" name="lastName" value="Blow">
                $("#free_prop_body").prepend('<tr>' +
                                             '<td class="version" data-version="'+data[index].version+'"> </td>' +
                                             '<td class="property"><a href="/key/' + data[index].k + '">'                         + data[index].k + '</a></td>' +
                                             '<td class="value"><a href="/key/' + data[index].k + '/value/' + data[index].v +'">' + data[index].v + '</a></td>' +
                                             '<td><span class="button tiny">Edit</span> <span class="button tiny fe_del_kv">Delete</span></td>' +
                                             '</tr>');
                index++;
            };
            $(".fe_del_kv").click( function() { isWellLoggedIn() ? delKeyValue($(this)) : loginProcess(); } );
        });
    }


    function displayProductsWithKey(_key, _value) {
        /* curl -X 'GET' \
            'https://api.folksonomy.openfoodfacts.org/products?k=test&v=test' \
            -H 'accept: application/json'
        */
        $("#main_column h1").before('<h2 id="key_title">Key: '+ _key + (_value ? ": "+ _value : '') + '</h2>' +
                                    '<p>List of products containing this key. You can also find the <a href="/keys">list of all other keys</a>.</p>' +
                                    '<ul id="product_list"></ul>');
        $("#main_column p").remove(); // remove <p>Invalid address.</p>
        $("#main_column h1").remove(); // remove <h1>Error</h1>
        console.log("FEUS - displayProductsWithKey(_key) - GET " + feAPIProductsURL + "?k=" + _key + (_value ? "&v="+ _value : ''));
        $.getJSON(feAPIProductsURL + "?k=" + _key + (_value ? "&v="+ _value : ''), function(data) {
            console.log("FEUS - displayProductsWithKey() - " + JSON.stringify(data));
            var index = 0;
            while (index < data.length) {
                $("#product_list").append('<li class="product_code">' +
                                          '<a href="/product/'+ data[index].product + '">' + data[index].product + '</a>' +
                                          '</li>');
                index++;
            };
        });
    }


    function displayAllKeys(_owner) {
        /* curl -X 'GET' \
             'https://api.folksonomy.openfoodfacts.org/keys' \
             -H 'accept: application/json'
        */
        //_key = _key.charAt(0).toUpperCase() + _key.slice(1);
        // TODO: add owner filter?
        // TODO: TABLE !!
        $("#main_column p").remove(); // remove <p>Invalid address.</p>
        $("#main_column h1").before('<h2 id="key_title">Keys</h2>' +
                                    '<p>List of all keys.</p>' +
                                    '<table id="keys_list">' +
                                    '<tr>' +
                                    '<th> </th>' +
                                    '<th class="key_name">Key</th>' +
                                    '<th class="count">Count</th>' +
                                    '<th class="values">Values</th>' +
                                    '</tr>' +
                                    '<tbody id="free_prop_body">' +
                                    '' +
                                    '</tbody>' +
                                    '</table>');
        $("#main_column h1").remove(); // remove <h1>Error</h1>
        console.log("FEUS - displayAllKeys(_owner) - GET " + feAPIKeysURL);
        $.getJSON(feAPIKeysURL, function(data) {
            console.log("FEUS - displayAllKeys() - " + JSON.stringify(data));
            var index = 0;
            while (index < data.length) {
                $("#keys_list").append('<tr class="key">' +
                                       '<td> </td>' +
                                       '<td><a href="/key/'+ data[index].k + '">' + data[index].k + '</a></td>' +
                                       '<td>' + data[index].count + '</td>' +
                                       '<td>' + data[index].values + '</td>' +
                                       '</tr>');
                index++;
            };
        });
    }


    function delKeyValue(_this) {
        // curl -X 'DELETE' \
        //   'https://api.folksonomy.openfoodfacts.org/product/3760256070970/Test1620205047424?version=1' \
        //   -H 'accept: application/json' \
        //   -H 'Authorization: Bearer charlesnepote__U0da47a42-eb96-4386-b2eb-6e1657b7f969'
        console.log("FEUS - delKeyValue() - start");
        console.log($(_this).parent().text());
        const _property = $(_this).parent().parent().children(".property").text();
        const _version = $(_this).parent().parent().children(".version").attr("data-version");
        console.log("Property: " + _property);
        console.log("Version: " + _version);
        fetch(deleteKVURL + "/" + code + "/" + _property + "?version=" + _version,{
            method: 'DELETE',
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + bearer,
                //'Content-Type':'application/json',
            }),
        })
            //.then(payload => payload.json())
            .then(resp => {
            var data = resp.data //
            console.log("FEUS - delKeyValue() - data: " + data);
            if (resp.ok) {
                // if success or delete the row
                console.log("FEUS - delKeyValue() - remove row");
                $(_this).parent().parent().remove();
            }
        })
            .catch(err => {
            console.log('FEUS - deleteKV() - ERROR. Something went wrong:' + err);
        });
    }


    function addKV(_code, _k, _v, _owner) {
        // curl -X 'POST' \
        //         'https://api.folksonomy.openfoodfacts.org/product' \
        //          -H 'accept: application/json' \
        //          -H 'Authorization: Bearer charlesnepote__U68ee7c02-20ff-42ab-a5a7-9436df6d5300' \
        //          -H 'Content-Type: application/json' \
        //          -d '{
        //                "product": "3760256070970",
        //                "k": "test",
        //                "v": "test1",
        //                "owner": "charlesnepote"
        //              }'
        console.log("FEUS - addKV() - bearer: " + bearer);
        fetch(addKVURL,{
            method: 'POST',
            //mode: 'no-cors',         // no!
            //withCredentials: true,   // no! provide CORS error
            //credentials: 'include',  // no! provide CORS error
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + bearer,
                'Content-Type':'application/json',
            }),
            body: '{"product": "' + _code + '", "k": "' + _k + '", "v": "' +_v + '"}'
        })
            .then(payload => payload.json())
            .then(resp => {
            var data = resp.data //
            console.log(JSON.stringify(data));
        })
            .catch(err => {
            console.log('FEUS - addKV() - ERROR. Something went wrong:' + err);
        });
    }


    function editKV(_code, _key, _value) {
        // {
        //   "product": "string",
        //   "k": "string",
        //   "v": "string",
        //   "owner": "",
        //   "version": 1,
        //   "editor": "string",
        //   "last_edit": "2021-05-06T07:50:53.258Z",
        //   "comment": ""
        // }

        // UI: create input field and replace "edit" button by "save" button
    }



    /**
     * Display all the free properties created and filed by users.
     * Examples:
     *    * Photo_Front: To be updated
     *
     * @returns none
     */
    function displayFolksonomyForm() {
        $(".details").before(
            '<div id="free_properties" style="background-color: ">' +
            '<h2>User properties</h2>' +
            '<p>This properties are created and filed by users for any kind of usages.</p>' +
            '<div id="product_free_properties" class="fieldset">' +
            '</div>' +
            '</div>')

        $.getJSON(feAPIProductURL, function(data) {
            console.log("FEUS - displayFolksonomyForm() - URL: " + feAPIProductURL);
            console.log("FEUS - displayFolksonomyForm() - " + JSON.stringify(data));
            var index = 0;
            while (index < data.length) {
                // TODO: links to 1. a page listing all the products related to the property (k);
                //                2. a page listing all the products related to the property-value pair (k, v).
                $("#product_free_properties").append(
                    '<form class="free_properties_form">' +
                    '<p class="property_value">' +
                    '<label for="feus-' + data[index].k + '" class="property">' + data[index].k + '</label> ' +
                    '<input id="feus-' + data[index].k + '" name="'+ data[index].k + '" class="value text" value="'+ data[index].v + '">' +
                    '</p>' +
                    '</form>'
                );
                index++;
            }
        });

        $("#free_properties").append(
            '<form class="new_free_properties_form" action="'+ addKVURL +'">' +
            '<p class="property_value">' +
            '<label for="k" class="property">Property: </label> ' +
            '<input id="feus-k" name="k" class="value text"></input>' +
            '<label for="v" class="property">Value: </label> ' +
            '<input id="feus-v" name="v" class="value text"></input>' +
            '</p>' +
            '<button>New property</button>' +
            '</form>'
        );
    }


    /**
     * isPageType: Detects which kind of page has been loaded
     * See also https://github.com/openfoodfacts/openfoodfacts-server/pull/4533/files
     *
     * @returns  {String} - Type of page: api|saved-product page|edit|list|search form|product view|error page
     */
    function isPageType() {
        // Detect API page. Example: https://world.openfoodfacts.org/api/v0/product/3599741003380.json
        let regex_api = RegExp('api/v0/');
        if(regex_api.test(document.URL) === true) return "api";

        // Detect API page. Examples:
        // * https://world.openfoodfacts.org/key/test
        // * https://world.openfoodfacts.org/key/test/value/test
        let regex_key = RegExp('key/');
        if(regex_key.test(document.URL) === true) return "key";

        // Detect API page. Example: https://world.openfoodfacts.org/key/test
        let regex_keys = RegExp('keys$');
        if(regex_keys.test(document.URL) === true) return "keys";

        // Detect producers platform
        var regex_pro = RegExp('\.pro\.open');
        if(regex_pro.test(document.URL) === true) proPlatform = true;

        // Detect "edit" mode.
        var regex = RegExp('product\\.pl');
        if(regex.test(document.URL) === true) {
            if ($("body").hasClass("error_page")) return "error page"; // perhaps a more specific test for product-not-found?
            if (!$("#sorted_langs").length) return "saved-product page"; // Detect "Changes saved." page
            else return "edit";
        }

        // Detect other error pages
        if ($("body").hasClass("error_page")) return "error page";

        // Detect page containing a list of products (home page, search results...)
        if ($("body").hasClass("list_of_products_page")) return "list";
        // Hack for Open Products Facts, Open Beauty Facts, etc.
        if ($(".products")[0]) return "list";

        // Detect search form
        var regex_search = RegExp('cgi/search.pl$');
        if(regex_search.test(document.URL) === true) return "search form";

        // Detect recentchanges
        if ($("body").hasClass("recent_changes_page")) return "recent changes";

        //Detect if in the list of ingredients
        regex_search = RegExp('ingredients');
        if(regex_search.test(document.URL) === true) return "ingredients";

        // Finally, it's a product view
        if ($("body").hasClass("product_page")) return "product view";

        // Hack for Open Products Facts, Open Beauty Facts...
        if($("body").attr("typeof") === "food:foodProduct") return "product view";
    }


    function loginProcess() {
        loginWindow =
            '<div id="fe_login_dialog" title="Dialog Form">' +
            '<form name="login_form">' +
            '<label>Username:</label>' +
            '<input name="username" type="text" value="'+ getConnectedUserID() + '">' +
            '<label>Password:</label>' +
            '<input name="password" type="password" value="">' +
            '<input id="login_submit" type="submit" value="Login">' +
            '</form>' +
            '<div id="login_result"></div>' +
            '</div>';
        showPopupInfo(loginWindow); // open a new window
        if (getConnectedUserID()) $('[name="password"]').focus();

        const form = document.forms['login_form'];
        console.log(form);
        form.addEventListener('submit', e => {
            console.log("FEUS - Submited");
            e.preventDefault();  // Do not submit the form
            const username = $('[name="username"]').val();
            const password = $('[name="password"]').val();
            console.log("FEUS - loginProcess - username: " + username + " - password: " + password);
            getCredentials(username, password, function() {
                console.log("FEUS - loginProcess() - callback");
                if (isWellLoggedIn() == true) togglePopupInfo(loginWindow);
                else return;
            });
        });

    }


    function getCredentials(_username, _password) {
        console.log("FEUS - getCredentials - call " + feAPI + "/auth");
        console.log("FEUS - getCredentials - username: " + _username + " - password: " + _password);
        fetch(feAPI + '/auth',{
            method: 'POST',
            headers:{
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=&username='+_username+'&password='+_password+'&scope=&client_id=&client_secret=',
        })
            .then(payload => payload.json())
            .then(resp => {
            console.log(resp);
            console.log(resp.access_token);
            bearer = resp.access_token;
            console.log("FEUS - getCredentials - bearer: " + bearer);
            localStorage.setItem('bearer',resp.access_token);
            localStorage.setItem('date',new Date().getTime());

            if (isWellLoggedIn() == true) togglePopupInfo(loginWindow);
        })
            .catch(err => {
            console.log('FEUS - getCredentials - ERROR. Something went wrong:' + err)
        });
    }


    // Show pop-up
    function showPopupInfo(message) {
        console.log("showPopupInfo(message) > "+$("#popup-info"));
        // Inspiration: http://christianelagace.com
        // If not already exists, create div for popup
        if($("#popup-info").length === 0) {
            $('body').append('<div id="popup-info" title="Information"></div>');
            $("#popup-info").dialog({autoOpen: false});
        }

        $("#popup-info").html(message);

        // transforme la division en popup
        let popup = $("#popup-info").dialog({
            autoOpen: true,
            width: 400,
            dialogClass: 'dialogstyleperso',
        });
        // add style if necessarry
        //$("#power-user-help").prev().addClass('ui-state-information');
        return popup;
    }

    // Toggle popup
    function togglePopupInfo(message) {
        if ($("#popup-info").dialog( "isOpen" ) === true) {
            $("#popup-info").dialog( "close" );
            return false;
        } else {
            return showPowerUserInfo(message);
        }
    }


    function isWellLoggedIn() {
        // User is not identified and has never been
        if (!localStorage.getItem('bearer')) {
            console.log("FEUS - isWellLoggedIn() - false (bearer does not exist)");
            return false;
        }
        let deadLine = parseFloat(localStorage.getItem('date')) + parseFloat(authrenewal);
        let rest = (deadLine - new Date().getTime())/1000; // Delay between deadline and now, in seconds
        console.log("FEUS - isWellLoggedIn - deadLine (" + deadLine + ") - new Date().getTime() (" + new Date().getTime() + ") = " + rest);
        //console.log("FEUS - isWellLoggedIn - localStorage.getItem('date'):" + localStorage.getItem('date'));
        if (deadLine < new Date().getTime()) {
            console.log("FEUS - isWellLoggedIn() - false ()");
            return false;
        }
        else {
            console.log("FEUS - isWellLoggedIn() - true");
            return true;
        }
    }


    /**
     * getConnectedUserID: returns user id of the current connected user
     *
     * @param    none
     * @returns  {String} user id; Example: "charlesnepote"
     */
    function getConnectedUserID() {
        // Extract connected user_id by reading <span id="#logged_in_user_id">charlesnepote</span>
        let user_name = $("#logged_in_user_id").text();
        console.log("getConnectedUserID() > user_name: " + user_name);
        return user_name;
    }


})();

