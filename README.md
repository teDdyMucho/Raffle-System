# MamaMo Raffle - Modern Raffle System

A modern, responsive web application for managing raffle systems with dual login roles (User and Admin). Built with React and Tailwind CSS.

## 🚀 Features

### 🔑 Authentication
- Single login interface with role selection (User/Admin)
- Secure authentication with role-based redirection
- Mock authentication system for development

### 👤 User Features
- **Landing Page**: Welcoming hero section with raffle branding and CTAs
- **Join Raffles**: Browse active raffles with countdown timers, join with custom or auto-generated ticket numbers
- **Past Results**: View previous raffle winners and results with search/filter functionality
- **Profile Page**: Manage account information and view ticket history

### 🛠 Admin Features
- **Dashboard**: Quick stats overview with total users, tickets sold, active raffles, and revenue
- **Raffle Management**: Create, edit, pause, resume, and manage raffles with winner selection
- **User Management**: View, ban/unban users, and monitor user activity
- **Reports**: Generate detailed analytics and export data (CSV/Excel)

### 🎨 Design Features
- Clean, modern UI with Tailwind CSS
- Animated transitions and countdown timers
- Responsive design for desktop and mobile
- Dark/light theme toggle
- Beautiful gradient backgrounds and hover effects

## 🛠 Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API

## 📦 Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd C:\Users\PC-1\Desktop\mamamoraffle
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

## 🔐 Demo Credentials

### User Login
- **Email**: `user@mamamo.com`
- **Password**: `user123`
- **Role**: User

### Admin Login
- **Email**: `admin@mamamo.com`
- **Password**: `admin123`
- **Role**: Admin

## 📁 Project Structure

```
mamamoraffle/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminOverview.js
│   │   │   ├── RaffleManagement.js
│   │   │   ├── UserManagement.js
│   │   │   └── Reports.js
│   │   ├── Auth/
│   │   │   └── Login.js
│   │   ├── Layout/
│   │   │   ├── AdminLayout.js
│   │   │   └── UserLayout.js
│   │   └── User/
│   │       ├── UserDashboard.js
│   │       ├── UserLanding.js
│   │       ├── JoinRaffles.js
│   │       ├── PastResults.js
│   │       └── UserProfile.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 🎯 Key Components

### Authentication System
- **AuthContext**: Manages user authentication state and login/logout functionality
- **Login Component**: Handles role-based login with demo credentials

### Theme System
- **ThemeContext**: Manages dark/light theme toggle with localStorage persistence
- **Theme Toggle**: Available in all layouts for seamless theme switching

### User Interface
- **Responsive Layouts**: Separate layouts for User and Admin with navigation
- **Interactive Components**: Countdown timers, progress bars, modals, and forms
- **Data Visualization**: Stats cards, charts, and tables for admin analytics

## 🔧 Customization

### Adding New Raffles
1. Navigate to Admin Panel → Raffle Management
2. Click "Create Raffle" button
3. Fill in raffle details (title, description, dates, pricing)
4. Save to create new raffle

### Theme Customization
Edit `tailwind.config.js` to customize colors, animations, and design tokens:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Custom primary colors
      },
      secondary: {
        // Custom secondary colors
      }
    }
  }
}
```

### Adding New Features
1. Create new components in appropriate directories
2. Add routes in respective Dashboard components
3. Update navigation in Layout components
4. Implement context providers for state management

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured interface with sidebar navigation
- **Tablet**: Adapted layouts with collapsible navigation
- **Mobile**: Touch-friendly interface with bottom navigation

## 🎨 Animation Features

- **Fade-in animations** for page loads
- **Slide-up animations** for cards and components
- **Hover effects** on interactive elements
- **Countdown timers** with real-time updates
- **Progress bars** with smooth transitions

## 🚀 Deployment

To build for production:

```bash
npm run build
```

The build folder will contain optimized production files ready for deployment.

## 🔮 Future Enhancements

- Real backend integration with API endpoints
- Payment processing integration
- Email notifications for winners
- Advanced analytics and reporting
- Mobile app version
- Social media integration
- Multi-language support

## 📄 License

This project is created for demonstration purposes. Feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ using React and Tailwind CSS**
