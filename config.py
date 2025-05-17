import os

class Config:
    """Base configuration class"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_key_replace_in_production')
    
    # Model settings
    MODEL_PATH = os.environ.get(r'planner\data\route_predictor_model.pth', 'route_predictor_model.pth')
    
    # Data paths 
    EARTHQUAKE_DATA_PATH = os.environ.get(r'planner\data\earthquake_events.csv', 'earthquake_events.csv')
    TSUNAMI_DATA_PATH = os.environ.get(r'planner\data\tsunami_events.csv', 'tsunami_events.csv')
    
    # API settings
    API_PREFIX = '/api'
    
    # Map settings
    DEFAULT_MAP_CENTER = {
        'lat': 20.5937,  # Center of India (approximately)
        'lng': 78.9629
    }
    DEFAULT_ZOOM = 5
    
    # Risk calculation settings
    DEFAULT_SEARCH_RADIUS_KM = 100
    
    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration"""
    # Production settings should be more secure
    SECRET_KEY = os.environ.get('SECRET_KEY') 
    
    # Set to False in production
    DEBUG = False
    
    # Use more robust caching in production
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 600

# Configuration dictionary
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Return the appropriate configuration object based on the environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config_by_name.get(env, config_by_name['default'])