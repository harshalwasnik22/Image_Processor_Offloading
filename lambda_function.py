import json
import base64
from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageDraw
from io import BytesIO
import numpy as np


# Helper functions for various image effects
def motion_blur(image, radius):
    kernel_size = radius * 2 + 1
    kernel = np.zeros((kernel_size, kernel_size), dtype=np.float32)
    kernel[radius, :] = np.ones(kernel_size)
    kernel /= kernel_size
    return image.filter(ImageFilter.Kernel((kernel_size, kernel_size), kernel.flatten()))

def radial_blur(image, strength):
    for i in range(strength):
        image = image.filter(ImageFilter.GaussianBlur(radius=i / 10.0))
    return image

def zoom_blur(image, strength):
    return image.filter(ImageFilter.GaussianBlur(radius=strength / 10.0))

def lens_blur(image, strength):
    return image.filter(ImageFilter.GaussianBlur(radius=strength / 10.0))

def mosaic(image, block_size):
    image = image.resize(
        (image.width // block_size, image.height // block_size),
        resample=Image.NEAREST
    )
    return image.resize(
        (image.width * block_size, image.height * block_size),
        resample=Image.NEAREST
    )

def flip_image(image, flip_type):
    if flip_type == 'horizontal':
        return ImageOps.mirror(image)
    elif flip_type == 'vertical':
        return ImageOps.flip(image)
    return image

def apply_sharpness(image, sharpness_factor):
    enhancer = ImageEnhance.Sharpness(image)
    return enhancer.enhance(sharpness_factor)

def apply_grayscale(image):
    return ImageOps.grayscale(image)

def invert_colors(image):
    return ImageOps.invert(image)

# Sepia filter function
def apply_sepia(image):
    sepia = np.array(image)
    tr = [0.393, 0.769, 0.189]
    tg = [0.349, 0.686, 0.168]
    tb = [0.272, 0.534, 0.131]
    
    # Apply the transformation
    r, g, b = sepia[:,:,0], sepia[:,:,1], sepia[:,:,2]
    sepia[:,:,0] = r * tr[0] + g * tr[1] + b * tr[2]
    sepia[:,:,1] = r * tg[0] + g * tg[1] + b * tg[2]
    sepia[:,:,2] = r * tb[0] + g * tb[1] + b * tb[2]
    
    sepia = np.clip(sepia, 0, 255)
    return Image.fromarray(sepia.astype(np.uint8))

# Adding noise
def add_noise(image, noise_level):
    noise = np.random.randint(0, noise_level, (image.height, image.width, 3), dtype='uint8')
    noisy_image = np.array(image) + noise
    noisy_image = np.clip(noisy_image, 0, 255)
    return Image.fromarray(noisy_image.astype(np.uint8))

# Vignette effect
def apply_vignette(image, strength=0.5):
    width, height = image.size
    x_center, y_center = width / 2, height / 2
    max_radius = np.sqrt(x_center**2 + y_center**2)

    # Create a vignette mask
    vignette_mask = Image.new('L', (width, height))
    for x in range(width):
        for y in range(height):
            distance = np.sqrt((x - x_center)**2 + (y - y_center)**2)
            vignette_value = int(255 * (1 - min(distance / max_radius * strength, 1)))
            vignette_mask.putpixel((x, y), vignette_value)

    # Apply the vignette mask
    image = Image.composite(image, Image.new('RGB', image.size, (0, 0, 0)), vignette_mask)
    return image

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def apply_tint(image, tint_color):
    # Check if the tint_color is a hex string
    if isinstance(tint_color, str) and tint_color.startswith('#'):
        tint_color = hex_to_rgb(tint_color)

    r, g, b = tint_color
    tinted_image = Image.new("RGB", image.size)
    for x in range(image.width):
        for y in range(image.height):
            pixel = image.getpixel((x, y))
            tinted_pixel = (
                min(int(pixel[0] + r), 255),
                min(int(pixel[1] + g), 255),
                min(int(pixel[2] + b), 255)
            )
            tinted_image.putpixel((x, y), tinted_pixel)
    return tinted_image

# Color enhancement
def enhance_colors(image, enhancement_factor):
    enhancer = ImageEnhance.Color(image)
    return enhancer.enhance(enhancement_factor)

# Lambda handler function
def lambda_handler(event, context):
    try:
        # Log the event for debugging
        print(f"Event received: {json.dumps(event)}")
        
        # Extract body parameters from the request
        body = json.loads(event['body'])
        image_data = body['image']
        width = body.get('width', 100)
        height = body.get('height', 100)
        effect_type = body.get('effectType', None)
        effect_strength = body.get('effectStrength', 0)
        rotation = body.get('rotation', 0)
        brightness = body.get('brightness', 100)
        contrast = body.get('contrast', 100)
        saturation = body.get('saturation', 100)
        flip_type = body.get('flipType', None)
        sharpness = body.get('sharpness', 100)
        apply_gray = body.get('applyGray', False)
        invert_colors_flag = body.get('invertColors', False)
        sepia = body.get('sepia', False)
        noise = body.get('noise', 0)
        vignette = body.get('vignette', False)
        vignette_strength = body.get('vignetteStrength', 0.5)
        tint_color = body.get('tintColor', None)
        color_enhancement = body.get('colorEnhancement', 1)

        # Decode the base64 image data
        image = Image.open(BytesIO(base64.b64decode(image_data)))
        
        # Log image size for debugging
        print(f"Image size before resizing: {image.size}")

        # Resize the image
        new_size = (int(image.width * (width / 100)), int(image.height * (height / 100)))
        image = image.resize(new_size, Image.LANCZOS)
        
        # Log new size for debugging
        print(f"Image size after resizing: {new_size}")

        # Apply selected image effect
        if effect_type == 'gaussian':
            image = image.filter(ImageFilter.GaussianBlur(radius=effect_strength))
        elif effect_type == 'box':
            image = image.filter(ImageFilter.BoxBlur(radius=effect_strength))
        elif effect_type == 'motion':
            image = motion_blur(image, effect_strength)
        elif effect_type == 'radial':
            image = radial_blur(image, effect_strength)
        elif effect_type == 'zoom':
            image = zoom_blur(image, effect_strength)
        elif effect_type == 'lens':
            image = lens_blur(image, effect_strength)
        elif effect_type == 'mosaic':
            image = mosaic(image, effect_strength)

        # Apply brightness, contrast, saturation adjustments
        if brightness != 100:
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(brightness / 100)
        if contrast != 100:
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(contrast / 100)
        if saturation != 100:
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(saturation / 100)

        # Apply sharpness
        if sharpness != 100:
            image = apply_sharpness(image, sharpness / 100)

        # Apply flipping
        if flip_type:
            image = flip_image(image, flip_type)

        # Apply grayscale
        if apply_gray:
            image = apply_grayscale(image)

        # Invert colors
        if invert_colors_flag:
            image = invert_colors(image)

        # Apply sepia filter
        if sepia:
            image = apply_sepia(image)

        # Apply noise
        if noise > 0:
            image = add_noise(image, noise)

        # Apply vignette effect
        if vignette:
            image = apply_vignette(image, vignette_strength)

        # Apply tint if provided
        if tint_color:
            image = apply_tint(image, tint_color)

        # Apply color enhancement
        if color_enhancement != 1:
            image = enhance_colors(image, color_enhancement)

        # Rotate the image
        image = image.rotate(rotation)

        # Ensure the image is in RGB mode for JPEG
        if image.mode == 'RGBA':
            image = image.convert('RGB')

        # Save the processed image to a BytesIO object
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        processed_image_data = buffered.getvalue()

        # Encode the processed image data in base64
        final_img = base64.b64encode(processed_image_data).decode('utf-8')

        # Log success for debugging
        print("Image processed successfully")

        # Return the base64-encoded image in JSON response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # Adjust for CORS
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            'isBase64Encoded': False,  # Make sure the API gateway handles this correctly
            'body': json.dumps({'processedImage': final_img})
        }

    except Exception as e:
        # Log the error for debugging
        print(f"Error processing image: {str(e)}")
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # Adjust for CORS
            },
            'body': json.dumps({'error': str(e)})
        }


