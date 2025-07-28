async function initDirectLinkService() {
    try {
      const ServiceModel = getModel("Service");
      
      // Kiểm tra xem đã có service với script_code là "direct_link" chưa
      const existingService = await ServiceModel.findOne({ script_code: "direct_link" });
      if (existingService) {
        console.log('Direct link service already exists. Skipping initialization.');
        return;
      }
  
      // Tạo service mới
      const newService = new ServiceModel({
        script_code: "direct_link",
        data: JSON.stringify({ link: "facebook.com" }),
        remaining: -1
      });
  
      // Lưu service mới vào database
      await newService.save();
  
      console.log('Direct link service initialized successfully');
    } catch (error) {
      console.error('Error initializing direct link service:', error);
    }
  }
  
  module.exports = { initDirectLinkService };