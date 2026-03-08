"""
conftest.py  (project root)
---------------------------
Inserts scripts/ into sys.path BEFORE pytest collects any test module.
This is the only place path manipulation happens.
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "script"))