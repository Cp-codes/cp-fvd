# Facebook Video Downloader

A fully functional, production-ready Facebook Video Downloader web application built with Node.js, Express, and modern frontend technologies.

## 🚀 Features

- **Clean & Modern UI**: Built with TailwindCSS for responsive design
- **Video Preview**: Shows thumbnail, title, and duration before download
- **Multiple Quality Options**: Download videos in various qualities (HD, SD, Mobile, Audio-only)
- **Real-time Validation**: Instant URL validation with user feedback
- **Error Handling**: Comprehensive error handling for invalid URLs and API issues
- **Mobile Responsive**: Fully optimized for mobile devices
- **Advertisement Ready**: Built-in advertisement spaces for monetization
- **SEO Optimized**: Proper meta tags and semantic HTML structure

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **TailwindCSS**: Utility-first CSS framework
- **JavaScript (ES6+)**: Modern JavaScript with classes and async/await
- **Font Awesome**: Icons and visual elements

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Axios**: HTTP client for API requests
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### API Integration
- **Custom Node.js Extraction**: Advanced web scraping and video URL extraction
- **No External APIs Required**: Self-contained solution

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd c:\Users\user\Desktop\reels\fvd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

## 🎯 Usage

### For Users
1. **Copy Facebook Video URL**: Go to Facebook, find the video you want to download, and copy its URL
2. **Paste URL**: Paste the URL into the input field on the homepage
3. **Click Download**: Click the "Download" button to fetch video details
4. **Choose Quality**: Select your preferred video quality from the available options
5. **Download**: Click on your chosen quality to start the download

### For Developers
The application is structured for easy customization and extension:

```
fvd/
├── public/
│   ├── index.html      # Main HTML file
│   └── script.js       # Frontend JavaScript
├── server.js           # Express server
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
└── README.md          # This file
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3002)

### Video Extraction
The application uses advanced Node.js techniques for Facebook video extraction:
- Multiple extraction methods for better success rate
- Direct page scraping with proper headers
- Mobile version fallback
- Embedded video extraction
- Comprehensive URL pattern matching

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment

#### Option 1: Traditional Hosting
1. Upload files to your web server
2. Install Node.js on the server
3. Run `npm install --production`
4. Set environment variables
5. Start with `npm start`

#### Option 2: Cloud Platforms (Heroku, Vercel, etc.)
1. Connect your repository
2. Set environment variables in the platform dashboard
3. Deploy automatically

#### Option 3: Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Considerations

- **Input Validation**: All URLs are validated before processing
- **Rate Limiting**: Consider implementing rate limiting for production use
- **HTTPS**: Use HTTPS in production for secure data transmission
- **User Agent Rotation**: Uses realistic browser headers to avoid blocking

## 🎨 Customization

### Styling
- Modify `public/index.html` for structure changes
- Update TailwindCSS classes for styling
- Add custom CSS in the `<style>` section

### Functionality
- Extend `public/script.js` for frontend features
- Modify `server.js` for backend functionality
- Add new API endpoints as needed

### Advertisement Integration
The application includes placeholder advertisement spaces:
- Header banner (728x90)
- Content banner (728x200)

Replace the placeholder divs with your actual ad code.

## 📱 Mobile Optimization

The application is fully responsive and includes:
- Mobile-first design approach
- Touch-friendly interface
- Optimized loading for mobile networks
- Responsive advertisement spaces

## 🐛 Troubleshooting

### Common Issues

1. **"Unable to fetch video details"**
   - Verify the Facebook URL is valid and public
   - Check if the video is still available
   - Try with a different video URL
   - Ensure the video is not private or restricted

2. **Downloads not working**
   - Check browser download settings
   - Verify popup blockers aren't interfering
   - Try with a different browser
   - Clear browser cache and cookies

3. **Server won't start**
   - Check if the port is available
   - Verify Node.js is installed correctly
   - Run `npm install` to ensure dependencies are installed
   - Check for any error messages in the console

4. **Video extraction fails**
   - Facebook may have updated their structure
   - Try different video URLs to test
   - Check server logs for detailed error messages
   - Some videos may require login or have geographic restrictions

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
DEBUG=true
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review the code comments
- Create an issue in the repository

## 🔄 Updates

To update the application:
1. Pull the latest changes
2. Run `npm install` for new dependencies
3. Restart the server

---

**Made with ❤️ for video enthusiasts**