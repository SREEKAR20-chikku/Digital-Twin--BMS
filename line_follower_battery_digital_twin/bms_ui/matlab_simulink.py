"""
Real-time Simulink integration for BMS UI
Requires: MATLAB installed + `pip install matlabengine`
"""

import matlab.engine
import time
import numpy as np

class SimulinkBMS:
    def __init__(self):
        self.eng = None
        self.model_name = 'battery_hybrid_digital_twin'
        
    def connect(self):
        """Start MATLAB engine and load model"""
        try:
            self.eng = matlab.engine.start_matlab()
            self.eng.cd(r'c:/Users/ponno/OneDrive/Desktop/line_follower_battery_digital_twin/matlab', nargout=0)
            self.eng.load_system(self.model_name, nargout=0)
            print("✅ Connected to Simulink model")
            return True
        except Exception as e:
            print(f"❌ MATLAB connection failed: {e}")
            return False
    
    def get_status(self):
        """Get current model outputs - assumes To Workspace blocks or get_param"""
        if self.eng is None:
            return None
            
        try:
            # Get workspace variables (assume model outputs to base workspace)
            soc = float(self.eng.workspace['SOC'])
            soh = float(self.eng.workspace['SOH'])
            temp = float(self.eng.workspace['TEMP'])
            
            # Or use get_param for block outputs
            # soc = float(self.eng.get_param(f'{self.model_name}/SOC_Gauge', 'Value'))
            
            return {
                'soc': soc,
                'soh': soh, 
                'temperature': temp,
                'voltage': 3.8,  # Add from model
                'current': -2.0  # Add from model
            }
        except:
            return None
    
    def step_simulation(self):
        """Run one simulation step"""
        if self.eng:
            self.eng.sim(self.model_name, 'StopTime', '1', nargout=0)
    
    def disconnect(self):
        if self.eng:
            self.eng.quit()

# Usage
if __name__ == "__main__":
    bms = SimulinkBMS()
    if bms.connect():
        try:
            while True:
                status = bms.get_status()
                if status:
                    print(status)
                time.sleep(1)
        finally:
            bms.disconnect()
