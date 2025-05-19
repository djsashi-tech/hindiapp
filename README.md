# Hindi Learning App for Kids

An interactive web application to help kids learn Hindi words through visual and audio aids.

## Features

- Interactive word display with images
- Category-based learning (Numbers, Animals, Colors)
- Audio pronunciation support
- Modern and kid-friendly UI
- Keyboard navigation support

## Local Setup Instructions

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

3.  **Install the required dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Initialize the database:**
    ```bash
    python populate_db.py
    ```

5.  **Run the application locally:**
    ```bash
    python app.py
    ```

6.  Open your browser and navigate to `http://localhost:5000`

## Deployment on Vercel

This project is configured for easy deployment on Vercel.

1.  **Push your code to a GitHub repository.** (Ensure your latest changes, including `vercel.json`, are pushed).

2.  **Sign up or Log in to Vercel:** Go to [vercel.com](https://vercel.com/).

3.  **Import your Project:**
    *   Click on "Add New..." -> "Project".
    *   Connect your Git provider (e.g., GitHub) and select your repository.

4.  **Configure Project (if needed):**
    *   Vercel should automatically detect the settings from the `vercel.json` file included in this repository.
    *   The `vercel.json` file configures the Python runtime and how to serve the Flask application using Gunicorn.
    *   Ensure the "Framework Preset" is set to "Other" or is not overriding Python-specific settings.
    *   The "Build Command" and "Install Command" can generally be left blank as `@vercel/python` handles this.

5.  **Deploy:** Click the "Deploy" button. Vercel will build and deploy your application.

After deployment, Vercel will provide you with a URL for your live application.

## Usage

- Use the navigation menu to switch between different word categories
- Press right arrow key (→) to see the next word
- Press left arrow key (←) to see the previous word
- Press spacebar to hear the pronunciation
- Click on category links in the navigation bar to filter words

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details