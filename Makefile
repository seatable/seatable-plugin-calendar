SHELL = /bin/sh
PYTHON = python3
VENV = venv
GIT_DIR = .git

$(VENV)/bin/tx: requirements.dev.txt | $(VENV)
	. $(VENV)/bin/activate && \
	$(PYTHON) -m pip install -U pip && \
	$(PYTHON) -m pip install -r requirements.dev.txt && \
	touch $@

$(VENV): | $(GIT_DIR)/info/exclude
	$(PYTHON) -m venv $@ && \
	(grep -Fx "$@/" $(GIT_DIR)/info/exclude || echo "$@/" >> $(GIT_DIR)/info/exclude)
