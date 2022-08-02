import dotenv from 'dotenv';

interface EnvironmentConfig {
  serviceName: string;
  serviceHost: string;
  servicePort: string;
  jwtSecret: string;
  nodeEnv: string;
}

/**
 * This is kind of an anti-pattern, but I consider it useful for this
 * sole purpose of storing the contents of an environment config inside of a class.
 * The benefits to this are not having to use conditionals for possible
 * non-existant environment variables such as:
 * process.env.SERVICE_HOST || 'default here'
 * Singletons are still at the end of the day, pretty neat.
 */
class Environment {
  private static _instance: Environment;

  private env: EnvironmentConfig;

  private constructor() {
    this.env = {
      serviceName: '',
      serviceHost: '',
      servicePort: '',
      jwtSecret: '',
      nodeEnv: ''
    };
  }

  public static getInstance(): Environment {
    if (!Environment._instance) {
      Environment._instance = new Environment();
    }
    return Environment._instance;
  }

  public loadAndSetDefaults() {
    dotenv.config();

    this.env.serviceName = process.env.SERVICE_NAME || 'api';
    this.env.serviceHost = process.env.SERVICE_HOST || '127.0.0.1';
    this.env.servicePort = process.env.SERVICE_PORT || '8080';
    this.env.jwtSecret = process.env.JWT_SECRET || 'fgc2022';
    this.env.nodeEnv = process.env.NODE_ENV || 'development';
  }

  public get(): EnvironmentConfig {
    return this.env;
  }
}

export default Environment.getInstance();
