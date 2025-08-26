@echo off
echo Installing GPU dependencies for SafeFace...
echo.

echo Step 1: Uninstalling CPU versions...
pip uninstall -y onnxruntime onnxruntime-cpu faiss-cpu

echo.
echo Step 2: Installing GPU versions...
pip install onnxruntime-gpu==1.16.3
pip install faiss-gpu==1.7.4

echo.
echo Step 3: Installing PyTorch with CUDA support...
pip install torch==2.1.1+cu118 torchvision==0.16.1+cu118 --extra-index-url https://download.pytorch.org/whl/cu118

echo.
echo Step 4: Installing other dependencies...
pip install -r requirements.txt

echo.
echo Installation completed!
echo Please restart the application to use GPU acceleration.
pause
