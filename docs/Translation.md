# Plugin Translation

The SeaTable calendar plugins translation are done with the _[Transifex]_ service.

You need:

* The `tx` utility, see _Dependencies_ below.
* A [Transifex API Token]

[Transifex]: https://www.transifex.com/
[Transifex API Token]: https://www.transifex.com/user/settings/api/

## Workflow

The workflow of translation is as following:

* Add new strings to the english translation file
* Use `push-translate` command defined in package.json to push translations to Transifex
* Translate the strings in Transifex
* Use `pull-translate` command to download translations from Transifex

If you add translations in your PR directly, they will be overwritten by the `pull-translate` command.

## Translation of the Plugin and localization of Calendar Dates

* react-intl-universal is used for string translations (`intl`, standard)
* the localizer of the calendar component is decorated by `intl-decorator` which adds `intl`  to it so that formats can be defined per locale/culture in either `intl`  or `intl-decorator`.

## Dependencies

The `tx` utility.

### Installing `tx` with `pip` and Python Virtual Env (`venv`)

The `venv/tx/bin` goal:

```shell
make venv/tx/bin
source venv/bin/activate
```

Manual setup:

```shell
python3 -m venv venv
source venv/bin/activate
echo "venv/" >> .git/info/exclude
python3 -m pip install -U pip
python3 -m pip install -r requirements.dev.txt
```
