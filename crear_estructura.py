import os

# Define the directory structure (relativo al proyecto actual)
base_dir = "src"
structure = {
    "components/auth": ["LoginPage.jsx", "ProtectedRoute.jsx"],
    "components/camas": ["AdminDashboard.jsx", "CamaForm.jsx", "CamaViewer.jsx", "QrGenerator.jsx", "SearchBar.jsx"],
    "components/layout": ["Navbar.jsx"],
    "firebase": ["config.js"],
    "hooks": ["useAuth.js"],
    "pages": ["AdminPage.jsx", "CamaPage.jsx", "HomePage.jsx"],
    ".": ["App.jsx", "main.jsx", "routes.jsx"]
}

# Create folders and empty files
for folder, files in structure.items():
    full_folder_path = os.path.join(base_dir, folder)
    os.makedirs(full_folder_path, exist_ok=True)
    for file_name in files:
        file_path = os.path.join(full_folder_path, file_name)
        with open(file_path, 'w') as f:
            f.write("")
