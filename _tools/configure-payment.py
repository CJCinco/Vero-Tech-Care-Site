#!/usr/bin/env python3
"""Privately configure local Stripe test bindings; never prints key values."""
import getpass
import os
from pathlib import Path
import re
import tempfile

root = Path(__file__).resolve().parents[1]
target = root / '.dev.vars'
print('Local VTC embedded checkout setup. Use TEST keys from the Vero Tech Care Stripe account.')
print('Input stays hidden. No payment will be made. No credentials will be uploaded or printed.')
secret = getpass.getpass('Stripe test secret or restricted key: ').strip()
public = getpass.getpass('Stripe test publishable key: ').strip()
if not re.fullmatch(r'(sk|rk)_test_[A-Za-z0-9]+', secret) or not re.fullmatch(r'pk_test_[A-Za-z0-9]+', public):
    raise SystemExit('No changes saved. Both values must be valid TEST key formats.')
if target.is_symlink():
    raise SystemExit('No changes saved: the local bindings file must not be a symbolic link.')
# Preserve unrelated existing bindings without displaying or transmitting them.
prior = target.read_text() if target.exists() else ''
kept = [line for line in prior.splitlines() if not re.match(r'^\s*(?:export\s+)?STRIPE_(SECRET|PUBLISHABLE)_KEY\s*=', line)]
content = '\n'.join(kept).rstrip() + '\nSTRIPE_SECRET_KEY=' + secret + '\nSTRIPE_PUBLISHABLE_KEY=' + public + '\n'
fd, temporary = tempfile.mkstemp(prefix='.dev.vars.', dir=root)
try:
    os.fchmod(fd, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(content)
    os.replace(temporary, target)
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)
print('Local test keys saved privately. Tell Codex setup is ready. Do not paste key values into chat.')
