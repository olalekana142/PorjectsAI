# Crypto Advisor

A smart cryptocurrency advisor that provides personalized trading recommendations based on market data and risk profiles.

## Features

- Real-time cryptocurrency market data
- Personalized recommendations based on risk profile
- Technical analysis and price predictions
- Beautiful, modern UI with real-time updates

## Tech Stack

- Backend: Flask (Python)
- Frontend: HTML5, CSS3, JavaScript
- APIs: CoinGecko API for market data
- Deployment: Render

## Local Development

1. Clone the repository
```bash
git clone <your-repo-url>
cd crypto-advisor
```

2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Run the application
```bash
python run.py
```

The application will be available at `http://localhost:5000`

## Deployment

This application is configured for deployment on Render. To deploy:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn run:app`

## Environment Variables

The following environment variables are required:

- `FLASK_ENV`: Set to 'production' for deployment
- `PORT`: Optional, defaults to 5000

## License

MIT License
