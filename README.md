# folksonomy_frontend
This is the [Folksonomy Engine](https://wiki.openfoodfacts.org/Folksonomy_Engine) front end. It is a user script for your browser, to let you add free tags to [Open Food Facts](https://world.openfoodfacts.org/)  products. Folksonomy Engine User Script (FEUS) is a kind of laboratory, to explore features and UI before they can get into Open Food Facts.

Main features (you have to install first to see it live):
* add a new "User properties" section, in each product view, to:
  * display product tags: eg. https://world.openfoodfacts.org/product/3760256070970/pesto-de-basilic
  * add new tags
  * delete tags
  * authenticate
* list all properties with stats; eg. https://world.openfoodfacts.org/keys
* list of products for a given property (key); eg. https://world.openfoodfacts.org/key/color_Of_The_Cap

It uses the [Folksonomy API](https://github.com/openfoodfacts/folksonomy_api).

![Luminosity property for a lightbulb](https://user-images.githubusercontent.com/1689815/117824899-23670480-b26f-11eb-81bc-430f0ff1831d.png)


# Install
To run userscripts it's best to have a script manager installed. Userscript managers are available as browser extensions:

* Greasemonkey  – works with Firefox - https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/
* Tampermonkey  – works with ~~Chrome~~, Safari, Firefox and other browsers - http://tampermonkey.net/
* Userscripts - works with Safari - https://apps.apple.com/kz/app/userscripts/id1463298887

**Note:** temporarily unavailable on Chrome, see: [issue #20](https://github.com/openfoodfacts/folksonomy_frontend/issues/20)

Choose an appropriate manager and install it according to the requirements of your browser.

Once your script manager is installed you can go to https://github.com/openfoodfacts/folksonomy_frontend/blob/main/feus.user.js

Just click on the Raw button and your script manager will ask you if you want to install the script.

# We need help
Any kind of contribution is welcome: coding or bug/enhancement reports.
Javascript coders: use easy to understand javascript; suggest small commits/PR; please aks/suggest before using a new library.

# Changelog
### 2021-09-14T16:54
* Add links to the properties' doc on the wiki (pages: list of properties, product's page)
* Better presentation of the "User properties" section on the product's page 
* new property form UI improvements: short hint that describes the expected value, examples below the boxes...
### 2021-05-21T23:30
* Add autocomplete to property field
### 2021-05-19T21:14
* New auth: no more need to authenticate if the user is already logued on Open Food Facts
* Edit button is now working
* UI improvements (deleted property is removed from table, etc.)
* Improvements in the javascript console: http queries are displayed in the console as curl command lines
### 2021-05-10T13:18
* Control prorperties' names (`^[a-z0-9_]+(\:[a-z0-9_]+)*$`)
* Beta alert
* Compatible with Open Products Facts, Open Beauty Facts, etc.
* Styling
* Small bugs fixed
### 2021-05-07T16:13
* Add a table of all keys (with stats); eg. https://world.openfoodfacts.org/keys
### 2021-05-07T12:37
* Add link to properties (keys) + list of products for each key
### 2021-05-05T09:33
* initial publication on this current Github repo
