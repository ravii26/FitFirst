import json
import os
import subprocess
import sys
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parent.parent

PROBE = (
    "import json, os, classifier; "
    "print(json.dumps({'env_path': str(classifier.ENV_PATH), "
    "'stray': os.getenv('FITFIRST_STRAY_ENV')}))"
)


def test_env_path_is_backend_env_from_any_working_directory(tmp_path):
    # A stray .env one level above the working directory: the old
    # load_dotenv("../.env") would have picked this up instead of backend/.env.
    (tmp_path / ".env").write_text("FITFIRST_STRAY_ENV=loaded\n")
    cwd = tmp_path / "elsewhere"
    cwd.mkdir()

    env = {k: v for k, v in os.environ.items() if k != "FITFIRST_STRAY_ENV"}
    env["PYTHONPATH"] = str(SERVICE_DIR)
    result = subprocess.run(
        [sys.executable, "-c", PROBE],
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
        check=True,
    )
    probe = json.loads(result.stdout.strip().splitlines()[-1])

    assert Path(probe["env_path"]) == SERVICE_DIR.parent / ".env"
    assert probe["stray"] is None
