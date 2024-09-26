import json
import base64
from PIL import Image, ImageFilter, ImageEnhance
from io import BytesIO
import numpy as np

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

def lambda_handler(event, context):
    body = json.loads(event['body'])
    image_data = body['image']
    width = body['width']
    height = body['height']
    effect_type = body['effectType']
    effect_strength = body['effectStrength']
    rotation = body['rotation']
    exposure = body['exposure']
    brightness = body['brightness']
    contrast = body['contrast']
    saturation = body['saturation']
    
    # Decode the image
    image = Image.open(BytesIO(base64.b64decode(image_data)))

    # Resize image
    new_size = (int(image.width * (width / 100)), int(image.height * (height / 100)))
    image = image.resize(new_size, Image.LANCZOS)

    # Apply effects based on the effect type
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

    # Apply adjustments
    if brightness != 100:
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(brightness / 100)

    if contrast != 100:
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(contrast / 100)

    if saturation != 100:
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(saturation / 100)

    # Rotate image
    image = image.rotate(rotation)

    # Convert to RGB if the image has an alpha channel
    if image.mode == 'RGBA':
        image = image.convert('RGB')

    # Save the processed image to a BytesIO object
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    processed_image_data = buffered.getvalue()  # Get binary data
    final_img = base64.b64encode(processed_image_data).decode('utf-8')
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': 'attachment; filename="processed-image.jpg"'
        },
        'body': final_img,  # Encode as base64 for transmission
        'isBase64Encoded': True  # Indicate that the body is base64 encoded
    }
