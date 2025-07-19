# Barcode Scanner Testing Guide

## Test Barcode: 4311501043271

You've provided a real barcode image with the EAN-13 code: **4311501043271**

## Manual Testing Steps

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Navigate to the barcode scanner page**:
   - Open: http://localhost:3000/calories-scan
   - Click the "Scannen" button to open the barcode scanner

3. **Test with your barcode image**:
   - Hold the barcode image (4311501043271) up to your camera
   - The scanner should detect and scan the barcode
   - It should auto-populate the product form with data from OpenFoodFacts

## Expected Results

When the barcode `4311501043271` is scanned:

1. **Scanner detects**: "4311501043271"
2. **API lookup**: Searches OpenFoodFacts database  
3. **Product data**: Auto-fills the form with:
   - Product name from OpenFoodFacts
   - Nutritional information (calories per 100g)
   - Quantity set to 100g by default

## Test Results

**Date**: ___________  
**Device**: ___________  
**Browser**: ___________  

- [ ] Barcode scanner opens successfully
- [ ] Camera initializes without errors  
- [ ] Barcode is detected and scanned
- [ ] Correct barcode value (4311501043271) is captured
- [ ] OpenFoodFacts API lookup succeeds
- [ ] Product form is auto-populated
- [ ] Product can be added to comparison table

## Troubleshooting

**If scanning fails**:
- Ensure good lighting
- Hold barcode steady in the scanning frame
- Try different angles/distances
- Check browser camera permissions

**If OpenFoodFacts lookup fails**:
- Verify internet connection
- Check browser console for API errors
- The barcode might not exist in OpenFoodFacts database

## iOS Safari Testing

This is particularly important since we switched from `react-zxing` to `html5-qrcode` specifically for iOS compatibility:

- [ ] Test on iPhone Safari
- [ ] Test on iPad Safari  
- [ ] Camera access works without errors
- [ ] Scanning performance is acceptable
- [ ] No black screen issues
- [ ] UI fits properly on mobile screens

## Success Criteria

✅ The barcode scanner should work reliably on iOS Safari  
✅ Scanning should detect the barcode correctly  
✅ OpenFoodFacts integration should work  
✅ Mobile UI should be responsive and usable  