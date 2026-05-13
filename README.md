# 📦 Product Inventory System

> A web-based application to manage product inventory — add, update, delete, and view products in real time with local storage persistence.

---

## 🖥️ Live Demo

Open `frontend/index.html` directly in any modern browser. No server required.

---

## 📌 Features

### ✅ Core Features
| Feature | Description |
|---|---|
| ➕ Add Product | Add a product with name, price, quantity, and category |
| ✏️ Update Stock | Edit any existing product's details |
| 🗑️ Delete Product | Remove a product with confirmation dialog |
| 📋 View Inventory | Paginated, sortable product table |

### ⭐ Bonus Features
| Feature | Description |
|---|---|
| 🔍 Search | Real-time search by product name |
| 🏷️ Filter | Filter by category |
| ⚠️ Low Stock Warning | Alert banner + badge for qty ≤ 5 |
| 💰 Total Inventory Value | Auto-calculated in header |
| 💾 Local Storage | Data persists across browser sessions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (Vanilla — glassmorphism, animations) |
| Logic | JavaScript (ES6+) |
| Storage | Browser `localStorage` |
| CI/CD | GitHub Actions |

---

## 🗂️ Folder Structure

```
inventory-system/
│
├── frontend/
│   ├── index.html    ← Main page (Disha)
│   ├── style.css     ← Styling & layout (Disha)
│   └── script.js     ← JS logic & localStorage (Tejaswini)
│
├── .github/
│   └── workflows/
│       └── main.yml  ← GitHub Actions CI (Tushar)
│
└── README.md         ← This file (Tushar)
```

---

## 🌿 Branch Strategy

| Branch | Owner | Purpose |
|---|---|---|
| `main` | — | Production-ready code |
| `tushar-docs` | Tushar | GitHub setup, CI config, README |
| `disha-ui` | Disha | HTML structure & CSS styling |
| `tejaswini-logic` | Tejaswini | JavaScript logic & local storage |

---

## 🔄 GitHub Workflow Used

1. **Branching** — Each member works on their own feature branch
2. **Commits** — Descriptive commit messages for every change
3. **Pull Requests** — Code reviewed before merging into `main`
4. **Merging** — PRs merged after review
5. **GitHub Actions** — CI pipeline validates project files on every push/PR

---

## ⚙️ GitHub Actions (CI)

The `.github/workflows/main.yml` pipeline runs on every push and pull request. It:
- Checks that all required files exist (`index.html`, `style.css`, `script.js`, `README.md`)
- Validates HTML structure (DOCTYPE, title, viewport meta, linked CSS/JS)
- Validates JS file (required functions + localStorage usage)
- Prints a success message on pass

---

## 👨‍💻 Team Members

| Member | Role | Contribution |
|---|---|---|
| **Tushar** | GitHub & Docs | Repo setup, branching, GitHub Actions, README |
| **Disha** | UI Design | `index.html` structure, `style.css` styling |
| **Tejaswini** | Logic | `script.js` — CRUD, localStorage, search, filter |

---

## 🚀 How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/tusharrr003/product-inventory-system.git
   cd product-inventory-system
   ```
2. Open `frontend/index.html` in your browser — **done!**

---

## 📸 Screenshots

> *(Add screenshots of the running app, GitHub branches, Pull Requests, and Actions here)*

---

## 📄 License

This project is created for educational purposes as part of TA3 academic assessment.
