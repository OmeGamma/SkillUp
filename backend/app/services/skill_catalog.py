import re
from typing import Dict, List, Set, Tuple

# Comprehensive taxonomy of skills mapped to their canonical names
SKILL_TAXONOMY: Dict[str, Dict] = {
    # Frontend
    "React": {"category": "Frontend", "aliases": ["reactjs", "react.js", "react-dom"]},
    "TypeScript": {"category": "Frontend", "aliases": ["ts"]},
    "JavaScript": {"category": "Frontend", "aliases": ["js", "es6", "ecmascript"]},
    "HTML5": {"category": "Frontend", "aliases": ["html", "html 5"]},
    "CSS3": {"category": "Frontend", "aliases": ["css", "css 3"]},
    "Tailwind CSS": {"category": "Frontend", "aliases": ["tailwindcss", "tailwind"]},
    "Next.js": {"category": "Frontend", "aliases": ["nextjs", "next"]},
    "Vue.js": {"category": "Frontend", "aliases": ["vue", "vuejs"]},
    "Angular": {"category": "Frontend", "aliases": ["angularjs", "angular.js"]},
    "Redux": {"category": "Frontend", "aliases": ["redux-toolkit", "rtk"]},
    "Vite": {"category": "Frontend", "aliases": ["vitejs"]},
    
    # Backend
    "Python": {"category": "Backend", "aliases": ["python3", "python 3", "py"]},
    "FastAPI": {"category": "Backend", "aliases": ["fast-api", "fastapi framework"]},
    "Django": {"category": "Backend", "aliases": ["django rest framework", "drf"]},
    "Flask": {"category": "Backend", "aliases": []},
    "Node.js": {"category": "Backend", "aliases": ["nodejs", "node"]},
    "Express.js": {"category": "Backend", "aliases": ["express", "expressjs"]},
    "Java": {"category": "Backend", "aliases": ["core java", "java 17", "java 11", "java 8"]},
    "Spring Boot": {"category": "Backend", "aliases": ["springboot", "spring-boot", "spring"]},
    "Go": {"category": "Backend", "aliases": ["golang"]},
    "C++": {"category": "Backend", "aliases": ["cpp", "c plus plus"]},
    "C#": {"category": "Backend", "aliases": ["csharp", "c sharp", ".net core", "dotnet"]},
    
    # Databases & Storage
    "PostgreSQL": {"category": "Databases", "aliases": ["postgres", "pgsql", "postgresql db"]},
    "MySQL": {"category": "Databases", "aliases": ["mysql server"]},
    "SQLite": {"category": "Databases", "aliases": ["sqlite3"]},
    "MongoDB": {"category": "Databases", "aliases": ["mongo"]},
    "Redis": {"category": "Databases", "aliases": ["redis cache"]},
    "Elasticsearch": {"category": "Databases", "aliases": ["elastic search", "elk"]},
    
    # Cloud, DevOps & Tools
    "Docker": {"category": "DevOps", "aliases": ["docker container", "docker-compose"]},
    "Kubernetes": {"category": "DevOps", "aliases": ["k8s", "kube"]},
    "AWS": {"category": "Cloud", "aliases": ["amazon web services", "ec2", "s3", "lambda"]},
    "Azure": {"category": "Cloud", "aliases": ["microsoft azure"]},
    "Google Cloud": {"category": "Cloud", "aliases": ["gcp", "google cloud platform"]},
    "Git": {"category": "DevOps", "aliases": ["git version control", "github", "gitlab"]},
    "CI/CD": {"category": "DevOps", "aliases": ["cicd", "continuous integration", "github actions", "jenkins"]},
    "Linux": {"category": "DevOps", "aliases": ["ubuntu", "bash", "shell scripting", "unix"]},
    
    # Data Science & Machine Learning
    "Machine Learning": {"category": "Data & AI", "aliases": ["ml", "machine learning algorithms"]},
    "Deep Learning": {"category": "Data & AI", "aliases": ["dl", "neural networks", "ann", "cnn"]},
    "Scikit-Learn": {"category": "Data & AI", "aliases": ["sklearn", "scikit learn"]},
    "Pandas": {"category": "Data & AI", "aliases": ["pandas library"]},
    "NumPy": {"category": "Data & AI", "aliases": ["numpy library"]},
    "PyTorch": {"category": "Data & AI", "aliases": ["torch"]},
    "TensorFlow": {"category": "Data & AI", "aliases": ["tf", "keras"]},
    "Computer Vision": {"category": "Data & AI", "aliases": ["cv", "opencv"]},
    "Natural Language Processing": {"category": "Data & AI", "aliases": ["nlp", "text processing"]},
    "SHAP": {"category": "Data & AI", "aliases": ["shap values", "explainable ai", "xai"]},
    "Data Analysis": {"category": "Data & AI", "aliases": ["eda", "exploratory data analysis", "data analytics"]},
    "Data Visualization": {"category": "Data & AI", "aliases": ["matplotlib", "seaborn", "tableau", "power bi"]},
    
    # Core CS & Architecture
    "Data Structures": {"category": "Core CS", "aliases": ["dsa", "data structures and algorithms"]},
    "Algorithms": {"category": "Core CS", "aliases": ["algo", "algorithm design"]},
    "System Design": {"category": "Core CS", "aliases": ["distributed systems", "system architecture", "software architecture"]},
    "REST APIs": {"category": "Core CS", "aliases": ["rest", "restful api", "restful apis", "restful"]},
    "GraphQL": {"category": "Core CS", "aliases": []},
    "Microservices": {"category": "Core CS", "aliases": ["microservice architecture"]},
    "SQL": {"category": "Core CS", "aliases": ["structured query language", "relational database query"]},
    "Unit Testing": {"category": "Core CS", "aliases": ["pytest", "jest", "unit test", "tdd"]},
    "Object-Oriented Programming": {"category": "Core CS", "aliases": ["oop", "oops"]}
}

# Inverted mapping for fast normalization (lowercase alias -> canonical skill name)
ALIAS_MAP: Dict[str, str] = {}
for canonical, details in SKILL_TAXONOMY.items():
    ALIAS_MAP[canonical.lower()] = canonical
    for alias in details["aliases"]:
        ALIAS_MAP[alias.lower()] = canonical

def normalize_skill(skill_raw: str) -> str:
    """Normalize a raw skill text to its canonical name if in taxonomy, else clean and title-case."""
    cleaned = skill_raw.strip()
    lower = cleaned.lower()
    if lower in ALIAS_MAP:
        return ALIAS_MAP[lower]
    # Remove excessive punctuation
    clean_text = re.sub(r'[^a-zA-Z0-9\+\#\.\s\-]', '', cleaned)
    return clean_text.title() if len(clean_text) > 2 else clean_text

def normalize_skill_list(skills: List[str]) -> List[str]:
    """Return a deduplicated list of canonical skill names."""
    normalized = set()
    for s in skills:
        norm = normalize_skill(s)
        if norm and len(norm) >= 2:
            normalized.add(norm)
    return sorted(list(normalized))

# Predefined standard industry roles catalog
PREDEFINED_ROLES = {
    "Full Stack Developer": {
        "required_skills": ["JavaScript", "TypeScript", "React", "Python", "FastAPI", "SQL", "Git", "REST APIs"],
        "preferred_skills": ["Docker", "Tailwind CSS", "PostgreSQL", "Redis", "Unit Testing", "CI/CD"],
        "min_experience_years": 0.0,
        "description": "Designs and develops full-stack web applications, integrating responsive frontends with high-throughput REST APIs and reliable relational databases.",
        "learning_pathway": [
            "Master TypeScript and React hooks architecture with clean state management.",
            "Build asynchronous RESTful microservices with FastAPI and SQLAlchemy.",
            "Implement relational schema migrations and caching with PostgreSQL and Redis.",
            "Containerize the application with Docker and build a CI/CD deployment pipeline."
        ],
        "project_recommendations": [
            "Build a full-stack collaborative task management SaaS with real-time updates and role-based permissions.",
            "Implement an e-commerce API backend with order processing, inventory transactions, and automated test coverage."
        ]
    },
    "Frontend Developer": {
        "required_skills": ["JavaScript", "TypeScript", "React", "HTML5", "CSS3", "Tailwind CSS", "Git"],
        "preferred_skills": ["Next.js", "Redux", "Unit Testing", "Vite", "REST APIs"],
        "min_experience_years": 0.0,
        "description": "Crafts accessible, high-performance web user interfaces with modern component frameworks and responsive design systems.",
        "learning_pathway": [
            "Deep-dive into modern CSS layout patterns, CSS Grid, Flexbox, and Tailwind utility systems.",
            "Learn React rendering lifecycle, memoization, and custom hooks.",
            "Write comprehensive component tests with Vitest and React Testing Library."
        ],
        "project_recommendations": [
            "Create an interactive analytics dashboard with customizable charts, theme switching, and responsive design.",
            "Build a component library with full keyboard accessibility and documentation."
        ]
    },
    "Backend Developer": {
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "REST APIs", "SQL", "Git", "Data Structures"],
        "preferred_skills": ["Docker", "Redis", "System Design", "Microservices", "Unit Testing", "CI/CD"],
        "min_experience_years": 0.0,
        "description": "Architects resilient server-side services, data models, authentication pipelines, and distributed event-driven systems.",
        "learning_pathway": [
            "Design database indexes, transaction isolation levels, and query optimization in PostgreSQL.",
            "Implement distributed rate limiting, token bucket algorithms, and caching with Redis.",
            "Study distributed systems concepts: idempotency, saga patterns, and graceful degradation."
        ],
        "project_recommendations": [
            "Engineer a high-throughput URL shortener with analytics, Redis caching, and rate limiting.",
            "Develop an event-driven notification engine supporting webhook deliveries and retry queues."
        ]
    },
    "Data Scientist / ML Engineer": {
        "required_skills": ["Python", "Machine Learning", "Scikit-Learn", "Pandas", "NumPy", "SQL", "Git"],
        "preferred_skills": ["Deep Learning", "PyTorch", "SHAP", "Docker", "FastAPI", "Data Visualization"],
        "min_experience_years": 0.0,
        "description": "Trains, evaluates, and deploys predictive machine learning models with rigorous statistical metrics and explainability.",
        "learning_pathway": [
            "Master feature engineering, cross-validation, and hyperparameter tuning with Scikit-Learn.",
            "Implement model explainability with SHAP (SHapley Additive exPlanations) for tree and linear models.",
            "Package trained ML models into production FastAPI inference endpoints with latency benchmarking."
        ],
        "project_recommendations": [
            "Develop an end-to-end customer churn or candidate readiness model with SHAP explanations and API deployment.",
            "Build a document classification and automated keyword extraction pipeline using TF-IDF and NLP techniques."
        ]
    },
    "DevOps / Cloud Engineer": {
        "required_skills": ["Linux", "Docker", "Git", "CI/CD", "AWS", "Python"],
        "preferred_skills": ["Kubernetes", "PostgreSQL", "REST APIs", "Unit Testing"],
        "min_experience_years": 0.0,
        "description": "Automates infrastructure provisioning, container orchestration, and continuous integration workflows.",
        "learning_pathway": [
            "Write robust multi-stage Dockerfiles optimized for size and security.",
            "Configure GitHub Actions CI/CD pipelines with linting, testing, and automated release builds.",
            "Master basic Kubernetes deployments, services, ingress, and config maps."
        ],
        "project_recommendations": [
            "Build a zero-downtime blue/green deployment workflow with GitHub Actions and Docker.",
            "Create an automated infrastructure monitoring and health check dashboard."
        ]
    }
}
