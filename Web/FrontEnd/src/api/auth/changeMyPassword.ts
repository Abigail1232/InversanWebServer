import axios from "../axios";

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    const response = await axios.patch("/api/users/me/change-password", {
      currentPassword,
      newPassword,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
