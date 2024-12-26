from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os
import logging

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Test cases for Two Sum problem
TEST_CASES = [
    {
        "input": "4 9\n2 7 11 15\n",
        "expected_output": "0 1\n"
    },
    {
        "input": "3 6\n3 2 4\n",
        "expected_output": "1 2\n"
    },
    {
        "input": "4 10\n5 2 3 8\n",
        "expected_output": "1 3\n"
    }
]

@app.route('/')
def index():
    return jsonify(status = 200)

@app.route('/run', methods=['POST'])
def run_code():
    try:
        logger.debug("Received request")
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({'success': False, 'error': 'Request must be JSON'}), 400

        data = request.json
        logger.debug(f"Received data: {data}")

        code = data.get('code')
        language = data.get('language')

        if not code or not language:
            logger.error("Missing code or language in request")
            return jsonify({'success': False, 'error': 'Missing code or language'}), 400

        # Create a temporary file for the code
        with tempfile.NamedTemporaryFile(suffix=get_file_extension(language), delete=False) as f:
            f.write(code.encode())
            file_path = f.name
            logger.debug(f"Created temporary file: {file_path}")

        results = []
        for i, test_case in enumerate(TEST_CASES):
            logger.debug(f"Running test case {i + 1}")
            result = run_test_case(file_path, language, test_case)
            results.append(result)
            logger.debug(f"Test case {i + 1} result: {result}")

        # Clean up
        os.unlink(file_path)
        logger.debug("Cleaned up temporary file")

        # Check if all test cases passed
        all_passed = all(result['passed'] for result in results)
        
        response = {
            'success': True,
            'results': results,
            'all_passed': all_passed
        }
        logger.debug(f"Sending response: {response}")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

def get_file_extension(language):
    extensions = {
        'python': '.py',
        'javascript': '.js',
        'java': '.java',
        'cpp': '.cpp'
    }
    return extensions.get(language, '.txt')

def run_test_case(file_path, language, test_case):
    try:
        logger.debug(f"Running test case with input: {test_case['input']}")
        
        if language == 'python':
            process = subprocess.run(
                ['python', file_path],
                input=test_case['input'].encode(),
                capture_output=True,
                timeout=2
            )
            logger.debug(f"Process returncode: {process.returncode}")
            logger.debug(f"Process stdout: {process.stdout}")
            logger.debug(f"Process stderr: {process.stderr}")
        actual_output = process.stdout.decode().strip() + '\n'
        expected_output = test_case['expected_output']
        passed = actual_output == expected_output
        return {
            'passed': passed,
            'input': test_case['input'].replace('\n', '<br>'),
            'expected_output': expected_output.strip(),
            'actual_output': actual_output.strip(),
            'error': process.stderr.decode() if process.stderr else None
        }
    except subprocess.TimeoutExpired:
        logger.error("Process timed out")
        return {
            'passed': False,
            'input': test_case['input'].strip(),
            'error': 'Time limit exceeded'
        }
    except Exception as e:
        logger.error(f"Error in run_test_case: {str(e)}", exc_info=True)
        return {
            'passed': False,
            'input': test_case['input'].strip(),
            'error': str(e)
        }
    
if __name__ == '__main__':
    app.run(debug=True) 